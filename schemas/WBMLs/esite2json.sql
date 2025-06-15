/* 
    SQL functions and procedure to translate an eSite Webbase (the ancestor of Spin the Web) to a JSON Webbase
    Usage: Launch the following T-SQL in an eSite Webbase (MS SQL Server 2017+) then exec dbo.spSTW 'en'
*/ 

DROP FUNCTION IF EXISTS dbo.fnSTWVisibility;
DROP FUNCTION IF EXISTS dbo.fnSTWLanguage;
DROP FUNCTION IF EXISTS dbo.fnSTWDatasources;
DROP FUNCTION IF EXISTS dbo.fnSTWCanonical;
DROP FUNCTION IF EXISTS dbo.fnSTWAreas;
DROP PROCEDURE IF EXISTS dbo.spSTW;

-- =============================================
-- Author:		Giancarlo Trevisan
-- Create date: 2023/02/05
-- Description:	Create JSON object for visibility key
-- Usage:		select dbo.fnSTWVisibility('S', 0)
-- =============================================
CREATE FUNCTION dbo.fnSTWVisibility(@type char(1), @id int)
RETURNS nvarchar(max)
AS 
BEGIN
	DECLARE @json nvarchar(max) = '';
	
	IF @type = 'S'
		SELECT @json += concat('"' + lower(E.fName) + '":', case when A.fVisibility = -1 then 'true' else 'false' end, ',')
			FROM dbo.eSiteEntities E left join (select * from dbo.eSiteAuthorizations where fSiteId = @id) A on A.fEntityId = E.fId
			WHERE E.fGroup = 1;

	ELSE IF @type = 'A'
		SELECT @json += concat('"' + lower(E.fName) + '":', case when A.fVisibility = -1 then 'true' else 'false' end, ',')
			FROM (select * from dbo.eSiteAuthorizations where fAreaId = @id) A left join dbo.eSiteEntities E on A.fEntityId = E.fId
			
	ELSE IF @type = 'P'
		SELECT @json += concat('"' + lower(E.fName) + '":', case when A.fVisibility = -1 then 'true' else 'false' end, ',')
			FROM (select * from dbo.eSiteAuthorizations where fPageId = @id) A left join dbo.eSiteEntities E on A.fEntityId = E.fId

	ELSE IF @type = 'C'
		SELECT @json += concat('"' + lower(E.fName) + '":', case when A.fVisibility = -1 then 'true' else 'false' end, ',')
			FROM (select * from dbo.eSiteAuthorizations where fContentId = @id) A left join dbo.eSiteEntities E on A.fEntityId = E.fId

	RETURN '{' + trim(',' FROM @json) + '}';
END

-- =============================================
-- Author:		Giancarlo Trevisan
-- Create date: 2023/02/05
-- Description:	Create JSON object for language key
-- Usage:		select dbo.fnSTWLanguage(-5004, 0)
-- =============================================
CREATE FUNCTION dbo.fnSTWLanguage(@idText int, @canonical int = 0)
RETURNS nvarchar(max)
AS 
BEGIN
	DECLARE @json nvarchar(max) = '';
	
	IF @canonical = 0
		SET @json = (
			select 
				it = case when fLanguage = 'it' then fText end,
				en = case when fLanguage = 'en' then fText end, 
				fr = case when fLanguage = 'fr' then fText end,
				de = case when fLanguage = 'de' then fText end,
				es = case when fLanguage = 'es' then fText end
			from dbo.eSiteTexts with (nolock)
			where fId = @idText 
			for json path, WITHOUT_ARRAY_WRAPPER
		);
	ELSE
		SET @json = (
			select 
				it = case when fLanguage = 'it' then dbo.fnSTWCanonical(fText) end,
				en = case when fLanguage = 'en' then dbo.fnSTWCanonical(fText) end, 
				fr = case when fLanguage = 'fr' then dbo.fnSTWCanonical(fText) end,
				de = case when fLanguage = 'de' then dbo.fnSTWCanonical(fText) end,
				es = case when fLanguage = 'es' then dbo.fnSTWCanonical(fText) end
			from dbo.eSiteTexts with (nolock)
			where fId = @idText 
			for json path, WITHOUT_ARRAY_WRAPPER
		);
		
	RETURN replace(@json, '"},{"', '","');
END

-- =============================================
-- Author:		Giancarlo Trevisan
-- Create date: 2023/02/05
-- Description:	Create JSON object for language key
-- Usage:		select dbo.fnSTWDatasources()
-- =============================================
CREATE FUNCTION dbo.fnSTWDatasources()
RETURNS nvarchar(max)
AS 
BEGIN
	DECLARE @json nvarchar(max) = '';
	SELECT 
		@json += trim('{}' from JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(value, '$.' + JSON_VALUE(value, '$.name'), JSON_VALUE(value, '$.description')), '$.name', null), '$.description', null)) + ','
	FROM 
		OPENJSON((SELECT lower(fName) as [name], fConnectionString as [description] FROM dbo.eSiteDatasources FOR json auto));

	RETURN '{' + trim(',' FROM @json) + '}';
END

-- =============================================
-- Author:		Giancarlo Trevisan
-- Create date: 2023/02/05
-- Description:	Remove all non alphanumeric characters from string
-- Usage:		select dbo.fnSTWCanonical('this is a test!')
-- =============================================
CREATE FUNCTION dbo.fnSTWCanonical(@text as nvarchar(max))
RETURNS nvarchar(max)
AS 
BEGIN
	DECLARE @canonicalText nvarchar(max) = '', @i int = 1, @c as nchar(1);

	WHILE @i <= len(@text) BEGIN
		SET @c = SUBSTRING(@text, @i, 1);
		IF CHARINDEX(@c, N'abcdefghijklmnopqrstuvwxyz0123456789') > 0
			SET @canonicalText += @c;
		SET @i += 1;
	END
	
	RETURN @canonicalText;
END

-- =============================================
-- Author:		Giancarlo Trevisan
-- Create date: 2023/02/05
-- Description:	Create webbaselet json
-- Usage:		select dbo.fnSTWAreas('en', null, '765368B7-8041-4383-9F07-29723280E8CE')
-- =============================================
CREATE FUNCTION dbo.fnSTWAreas(@lang varchar(5) = 'en', @idParent int, @parentGUID as char(36))
RETURNS nvarchar(max)
AS
BEGIN
	RETURN (select 
		A.fGUID as [_id]
		, @parentGUID as [_idParent]
		, 'area' as [type]
		, '' as [status]
		, JSON_QUERY(dbo.fnSTWLanguage(A.fName, 0)) as [name]
		, JSON_QUERY(dbo.fnSTWLanguage(A.fName, 1)) as [slug]
		, JSON_QUERY(dbo.fnSTWLanguage(A.fIcon, 0)) as [icon]
		, (select fGUID from eSitePages where fId = A.fMainPage) as [mainpage]
		, JSON_QUERY(dbo.fnSTWVisibility('A', A.fId)) as [visibility]
		, JSON_QUERY(concat(dbo.fnSTWAreas(@lang, A.fId, A.fGUID),
			(select 
				P.fGUID as [_id]
				, A.fGUID as [_idParent]
				, 'page' as [type]
				, '' as [status]
				, JSON_QUERY(dbo.fnSTWLanguage(P.fTitle, 1)) as [slug]
				, JSON_QUERY(dbo.fnSTWLanguage(P.fTitle, 0)) as [name]
				, JSON_QUERY(dbo.fnSTWLanguage(A.fIcon, 0)) as [icon]
				, P.fTemplate as [template]
				, JSON_QUERY(dbo.fnSTWLanguage(P.fKeywords, 0)) as [keywords]
				, JSON_QUERY(dbo.fnSTWLanguage(P.fDescription, 0)) as [description]
				, JSON_QUERY(dbo.fnSTWVisibility('P', P.fId)) as [visibility]
				, (select 
						C.fGUID as [_id]
						, P.fGUID as [_idParent]
						, 'content' as [type]
						, null as [status]
						, JSON_QUERY('{"' + @lang + '":"' + dbo.fnSTWCanonical(C.fDescription) + '"}') as [slug]
						, JSON_QUERY('{"' + @lang + '":"' + C.fDescription + '"}') as [name]
						, C.fCSSClass as [cssclass]
						, cast(C.fSection as nvarchar(32)) as [section]
						, cast(C.fSequence as decimal(10,2)) as [sequence]
						, C.fRenderAs as [subtype]
						, (select fName from dbo.eSiteDataSources where fId = C.fDataSource) as [dsn]
						, C.fQuery as [query]
						, C.fParameters as [params]
						, JSON_QUERY(dbo.fnSTWLanguage(C.fId, 0)) as [layout]
						, JSON_QUERY(dbo.fnSTWVisibility('C', C.fId)) as [visibility]
					from eSiteContents C where P.fId = C.fPageId for json path, INCLUDE_NULL_VALUES) as children
			from eSitePages P where P.fAreaId = A.fId for json path, INCLUDE_NULL_VALUES))) as children
	from eSiteAreas A where isnull(A.fParentArea, 0) = isnull(@idParent, 0) for json path, INCLUDE_NULL_VALUES);
END;

-- =============================================
-- Author:		Giancarlo Trevisan
-- Create date: 2023/02/05
-- Description:	Create WBDL.json
-- Usage:		exec dbo.spSTW 'it'
-- =============================================
CREATE PROCEDURE dbo.spSTW(@lang varchar(5) = 'en')
AS 
BEGIN
	declare @json as nvarchar(max) = '';

	set @json = (select 
		S.fGUID as [_id]
		, null as [_idParent]
		, 'site' as [type]
		, '' as [status]
		, S.fLanguage as [lang]
		, JSON_QUERY(dbo.fnSTWLanguage(S.fName, 0)) as [name]
		, CONCAT(s.fProtocol, fURL) as [url]
		, (select fGUID from eSitePages where fId = S.fHomePage) as [mainpage]
		, JSON_QUERY(dbo.fnSTWVisibility('S', S.fId)) as [visibility]
		, JSON_QUERY(dbo.fnSTWDatasources()) as [datasources]
		, JSON_QUERY(dbo.fnSTWLanguage(S.fIcon, 0)) as [icon]
		, JSON_QUERY(dbo.fnSTWLanguage(S.fKeywords, 0)) as [keywords]
		, JSON_QUERY(dbo.fnSTWLanguage(S.fDescription, 0)) as [description]
		, JSON_QUERY(dbo.fnSTWAreas(@lang, null, S.fGUID)) as [children]
	from 
		eSiteSites S
	for json path, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES);
	
	select @json as JSON;
END
