/**
 * Spin the Web Site miscellanea functions
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/

/**
 * Given text sprinkeled with placeholders, a placeholder is a variable prefixed with \@, \@@ or \@@@, replace the placeholders applying these rules:
 * * Replace the placeholder with its value
 * * If the placeholder has no value and is inside square brackets ([]): remove everything within and including the square brackets and the first word next to the closing bracket (]) or the first word preceeding the opening bracket ([) 
 * * If the placeholder has a value and is inside square brackets simply remove the square brackets
 * * Braces ({}) confine the behavior of square brackets, and are removed
 * * If a placeholder is surronded by single (') or double quotes ("), double all single or double quotes in the value
 * * If a placeholder is enclosed within single (') or double (") quotes immediately followed by ellipses (...) and its value is a comma separated list of values then each of the these values will be enclosed in single or double quotes else the placeholder is replace with its value in all cases the ellipses are removed
 * 
 * TODO: remove trailing or leading word ... '' "". What practical use could `` have?
 * 
 * @param text Text sprinkeled with placeholders \@\<name>, \@@\<name> and or \@@@<name>
 * @param placeholders Placeholders values
 * @returns 
 */
export function processPlaceholders(text: string, placeholders: Map<string, string>) {
	text = text.replace(/(\b\s*|\W\s*)?(\[.*?\])(\s*\b|\s*\W)?/g, function (match, p1, p2, p3, _offset, _s) {
		let flag: boolean = false;
		match = match.replace(/(\/?@@\*?[_a-z][a-z0-9_.$]*)/ig, function (_match, p1, _offset, _s) {
			if (p1.charAt(0) === "/") return p1.substr(1);
			if (p1.charAt(1) === '@') {
				if (placeholders.has(p1.substr(1))) {
					flag = true;
					return placeholders.get(p1.substr(2));
				}
			} else if (placeholders.has(p1.substr(1))) {
				flag = true;
				return placeholders.get(p1.substr(1));
			}
			return '';
		});
		if (flag) 
			return p1 + p2.substr(1, p2.length - 2) + p3; // Remove []
		if (p3) 
			return p1;
		return "";
	});

	return text.replace(/(\/?@@?\*?[_a-z][a-z0-9_.$]*)/ig, function (_match, p1, _offset, _s) {
		if (p1.charAt(0) === '/')
			return p1.substr(1);
		if (p1.charAt(1) === '@') 
			return placeholders.get(p1.substr(2)) || "";
		
		return placeholders.get(p1.substr(1)) || "";
	});
}

/*
Private Function ExpParse(code As String, params As String, Optional IsSQL As Boolean = False) As String
  Dim i As Long, j As Long, k As Long, c As String, valueList As Boolean, valueDelimiter As String, Param As String
  
  code = Replace(code, "...", "�")
  code = Replace(code, "\@", cATSIGN)
  
  i = InStr(code, "@")
  While i > 0
    'Search for end of variable
    For j = i + 1 To Len(code)
      c = LCase(Mid$(code, j, 1))
      If Not (c Like "#" Or c Like "[a-z]" Or c = "_" Or c = "*" Or c = "." Or ((c = "@" Or c = "*") And j = i + 1)) Then Exit For
    Next
    
    'Delimit and insert value
    If i - k - 1 > 0 Then ExpParse = ExpParse & Mid$(code, k + 1, i - k - 1)
    
    k = j - 1
    
    valueList = False
    valueDelimiter = ""
    If Mid$(code, j, 1) = "�" Then
      valueList = True: k = k + 1
    ElseIf Mid$(code, j + 1, 1) = "�" Then
      valueList = True: valueDelimiter = Mid$(code, j, 1): k = k + 2
    End If
    
    Param = Mid(code, i, j - i)
    If IsSQL Then
      If valueDelimiter = "'" Then
        ExpParse = ExpParse & cSEPARATOR & ExpValue(Param, valueList, valueDelimiter, params, IsSQL) & cSEPARATOR
        ExpParse = Replace(ExpParse, valueDelimiter & cSEPARATOR & valueDelimiter & cSEPARATOR, cSEPARATOR & cSEPARATOR)
      Else
        ' If parameter is delimited by | then don't double single quotes
        If InStr(i - 1, code, "|" & Param & "|") = i - 1 Then
          k = k + 1
          ExpParse = Left(ExpParse, Len(ExpParse) - 1) & cSEPARATOR & ExpValue(Param, valueList, valueDelimiter, params) & cSEPARATOR
        Else
          ExpParse = ExpParse & cSEPARATOR & Replace(ExpValue(Param, valueList, valueDelimiter, params) & "", "'", "''") & cSEPARATOR
        End If
      End If
    Else
      ExpParse = ExpParse & cSEPARATOR & ExpValue(Param, valueList, valueDelimiter, params) & cSEPARATOR
    End If
    
    i = InStr(j, code, "@")
  Wend
  ExpParse = ExpParse & Mid$(code, k + 1)
  
  'Remove unwanted
  i = 1
  Do
    i = InStr(i, ExpParse, cSEPARATOR)
    If i = 0 Then Exit Do
    ExpClean ExpParse, i, (Mid(ExpParse, i + 1, 1) <> cSEPARATOR)
  Loop While True
      
  ExpParse = Replace(ExpParse, cSEPARATOR, "")
  ExpParse = Replace(ExpParse, cSPACER, "")
  ExpParse = Replace(ExpParse, cATSIGN, "@")
End Function

Private Function ExpValue(varName As String, valueList As Boolean, valueDelimiter As String, params As String, Optional IsSQL As Boolean = False) As Variant
  Dim i As Long, k As Long, List As Variant, s As String
  
  On Error Resume Next
  
  If Left(varName, 2) = "@@" Then 'Form, Record, Session, Application, or Server variable
    varName = Mid(varName, 3)
    
    Select Case varName
    Case "eSiteKeyValue"
      ExpValue = pASPSession("eSiteKeyValue")
    Case "eSiteQueryColumns"
      If pRS Is Nothing Then ExpValue = 0 Else ExpValue = pRS.Fields.count
    Case "eSiteKeyExpires"
      s = Connect.Execute("SELECT fKey FROM eSiteSites").Fields(0).value
      ExpValue = FormatField(DateSerial(2000 + Asc(Mid(s, 21, 1)) - 64, Asc(Mid(s, 22, 1)) - 64, Val(Right(s, 2))) + 1, "", adDate)
    Case "eAttributeSiteName"
      ExpValue = Attributes(eAttributeSiteName)
    Case "eAttributeSiteIcon"
      ExpValue = Attributes(eAttributeSiteIcon)
    Case "eAttributeSiteImage"
      ExpValue = Attributes(eAttributeSiteImage)
    Case "eAttributeSiteInfo"
      ExpValue = Attributes(eAttributeSiteInfo)
    Case "eAttributeAreaName"
      ExpValue = Attributes(eAttributeAreaName)
    Case "eAttributeAreaIcon"
      ExpValue = Attributes(eAttributeAreaIcon)
    Case "eAttributeAreaImage"
      ExpValue = Attributes(eAttributeAreaImage)
    Case "eAttributePageTitle"
      ExpValue = Attributes(eAttributePageTitle)
    Case "eAttributePageIcon"
      ExpValue = Attributes(eAttributePageIcon)
    Case Else
      ExpValue = eSiteForm(varName)
    End Select
    If IsEmpty(ExpValue) And Not pRS Is Nothing Then
      If pContentLayout.Settings(eSetTranspose) <> "true" Then
        ExpValue = pRS.Fields(varName).value
      Else
        pRS.filter = pRS.Fields(0).Name & "='" & varName & "'"
        ExpValue = pRS.Fields(1).value
        pRS.filter = ""
      End If
      Err.Clear 'Current record set
    End If
    
    If IsEmpty(ExpValue) Then ExpValue = pASPSession.Contents(varName)
    If IsEmpty(ExpValue) Then ExpValue = pASPApplication.value(varName)
    If IsEmpty(ExpValue) Then ExpValue = pASPRequest.ServerVariables(varName)
  Else 'Query string variable or cookie
    ExpValue = RequestQueryString(Mid(varName, 2))
  
    If ExpValue = "" Then
      ExpValue = pASPRequest.Cookies(Mid(varName, 2))
    End If
  End If
  
  'Check for default value
  If (ExpValue = "" Or IsEmpty(ExpValue)) And params <> "" Then
    ExpValue = params
  
    i = InStr(";" & LCase(params), ";" & LCase(varName) & "=")
    If i > 0 Then
      i = InStr(i + 1, params, "=")
      k = InStr(i + 1, params, ";")
      If k = 0 Then ExpValue = Mid(params, i + 1) Else ExpValue = Mid(params, i + 1, k - i - 1)
      ExpValue = Evaluate("=" & ExpValue, , params)
    Else
      ExpValue = ""
    End If
  End If
  
  If valueList Then
    If Not (RTrim(ExpValue) = "" Or IsEmpty(ExpValue)) Then
      List = Split(ExpValue, ",")
      ExpValue = ""
      For i = 0 To UBound(List)
        If IsSQL Then
          ExpValue = IIf(ExpValue = "", "", ExpValue & ", " & valueDelimiter) & Replace(Trim(List(i)), "'", "''") & valueDelimiter
        Else
          ExpValue = IIf(ExpValue = "", "", ExpValue & ", " & valueDelimiter) & Trim(List(i)) & valueDelimiter
        End If
      Next
      Erase List
    Else
      ExpValue = valueDelimiter
    End If
  End If
End Function



Private Sub ExpClean(ByRef txt As String, ByRef i As Long, onlyDelimiters As Boolean)
  Dim s As Long, e As Long, l As Long, c As String, leftDelimiter As String, rightDelimiter As String

  leftDelimiter = "[": rightDelimiter = "]": GoSub cleanIt
  leftDelimiter = "{": rightDelimiter = "}": GoSub cleanIt
  Exit Sub
  
cleanIt:
  For e = i + 1 To Len(txt)
    c = Mid(txt, e, 1)
    
    If leftDelimiter = "{" And c = cSEPARATOR And e <> i + 1 Then Exit For
    
    If c = rightDelimiter Then
      If l = 0 Then
        For s = i To 1 Step -1
          c = Mid(txt, s, 1)
          
          If rightDelimiter = "}" And c = cSEPARATOR Then onlyDelimiters = True
          
          If c = leftDelimiter Then
            If l = 0 Then
              If onlyDelimiters Then
                Mid(txt, s, 1) = cSPACER: Mid(txt, e, 1) = cSPACER: i = e
              ElseIf e = Len(txt) Then
                txt = Left(txt, s - 1): i = s - 1: If rightDelimiter <> "}" Then ExpOperator txt, i
              Else
                txt = Left(txt, s - 1) & cSPACER & Mid(txt, e + 1): i = s: If rightDelimiter <> "}" Then ExpOperator txt, i
              End If
              Return
            End If
            l = l - 1
          ElseIf c = rightDelimiter Then
            l = l + 1
          End If
        Next
        Exit For
      End If
      l = l - 1
    ElseIf c = leftDelimiter Then
      l = l + 1
    End If
  Next
  
  If rightDelimiter = "}" And (s = 0 Or e = Len(txt)) Then i = i + 2 'There are no braces, skip delimiters
  
  Return
End Sub

function ExpOperator(txt: string, i: number): void {
  let s: number, e: number;
  
  if (!txt)
		return;
  
  // Try eliminating operator on the right
  for (s = i; s < txt.length) {
	if (")]}".indexOf(substring(txt, s, 1)) != -1)
		break;
    ElseIf InStr(cWHITESPACE, Mid(txt, s, 1)) = 0 Then
      For e = s To Len(txt)
        If InStr("{[(" & cWHITESPACE, Mid(txt, e, 1)) > 0 Then txt = Left(txt, s - 1) & Mid(txt, e): Exit Sub
      Next
      Exit For
    End If
  }
  
  // Try eliminating operator on the left
  For e = i - 1 To 1 Step -1
    If InStr("{[(", Mid(txt, e, 1)) > 0 Then
      Exit For
    ElseIf InStr(cWHITESPACE, Mid(txt, e, 1)) = 0 Then
      For s = e To 1 Step -1
        If InStr("{[()]}" & cWHITESPACE, Mid(txt, s, 1)) > 0 Then txt = Left(txt, s) & Mid(txt, e + 1): i = s + 1: Exit Sub
      Next
      Exit For
    End If
  Next
}
  */