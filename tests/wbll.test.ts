import { assertEquals } from "@std/assert";
import { STWLayout } from "../stwContents/wbll.ts";

const Placeholders = new Map<string, string>([
	["@session", "123"],
	["@email", "john.doe@email.com"],
]);

const Records = {
	affectedRows: 3,
//	fields: [{ name: "nome" }, { name: "altezza" }, { name: "dataDiNascita" }, { name: "sesso" }],
	fields: ["nome", "altezza", "dataDiNascita", "sesso"],
	rows: [
		{ nome: "Mario Rossi", altezza: 1.78, dataDiNascita: "1985-04-12", sesso: "" },
		{ nome: "Luca Bianchi", altezza: 1.82, dataDiNascita: "1990-09-23", sesso: "M" },
		{ nome: "Giulia Verdi", altezza: 1.65, dataDiNascita: "1995-01-30", sesso: "F" }
	]
};

const Examples = [
	{ wbll: `\\A('onclick=\"/@@slug\"')n('2;Mario Rossi;<i class=\"fa-light fa-globe\"></i>;Area;<i class=\"fa-light fa-folder\"></i>;Page;<i class=\"fa-light fa-file\"></i>;Content;<i class=\"fa-light fa-puzzle-piece\"></i>;;<i class=\"fa-light fa-square\"></i>')a('/stws/editcontent')p<<f`, html: `<i class="fa-light fa-globe"></i> <a href="http://localhost/stws/editcontent?altezza=1.78">Mario Rossi</a>`, isForm: false },
	{ wbll: `j('alert("Hello {@@nome}!")')`, html: `<script>alert("Hello Mario Rossi!")</script>`, isForm: false },
	{ wbll: `f>>f<n('2;M;Maschio;F;Femmina;*;N.D.')`, html: ` Mario Rossi   N.D.`, isForm: false },
	{ wbll: `i('/logo.png')\\a('alt="logo @@altezza" title="@@nome This is an image" @@blank')`, html: `<img alt="logo 1.78" title="Mario Rossi This is an image"  src="/logo.png">`, isForm: false },
	{ wbll: `\\s('caption')whel`, html: `<input type="password" name="nome" value="Mario Rossi"><input type="hidden" name="altezza" value="1.78"><input name="dataDiNascita" value="1985-04-12"><label>sesso</label>`, isForm: true },
	{ wbll: `l('Nome')t(' ')e`, html: `<label>Nome</label> <input name="nome" value="Mario Rossi">`, isForm: true },
	{ wbll: `lelele`, html: `<label>nome</label><input name="nome" value="Mario Rossi"><label>altezza</label><input name="altezza" value="1.78"><label>dataDiNascita</label><input name="dataDiNascita" value="1985-04-12">`, isForm: true },
	{ wbll: `a('http://www.keyvisions.it')ppt('Click here')`, html: ` <a href="http://www.keyvisions.it/?nome=Mario+Rossi&altezza=1.78">Click here</a>`, isForm: false },
	{ wbll: `t('<b>Bold Text</b>')`, html: `<b>Bold Text</b>`, isForm: false },
	{ wbll: `\\s('caption=\"Logon\"')e(';;@usr')\\a('placeholder=\"username\"')t(' ')w(';@pwd')\\a('placeholder=\"password\"')t(' ')b(';stw;logon')t('Logon')t(' ')b(';stw;insert')t('Insert')\\rt('Forgot password?')a('/stw/reset')t('click here')`, html: `<input name="nome" value="Mario Rossi" placeholder="username"> <input type="password" name="altezza" value="1.78" placeholder="password"> <button value="stwlogon" name="stwAction" type="submit">Logon</button> <button value="stwinsert" name="stwAction" type="submit">Insert</button><br>Forgot password? <a href="http://localhost/stw/reset">click here</a>`, isForm: true },
];

Deno.test("examples", async () => {
	let fails = 0;

	let log = `wbll test failures: ${new Date().toISOString()}\n\n`;
	log += "\nFailures:\n";

	for (const [_i, ex] of Examples.entries()) {
		try {
			const placeholders = new Map(Placeholders);
			for (const [name, value] of Object.entries(Records.rows[0]))
				placeholders.set(`@@${name}`, String(value));

			const layout = new STWLayout(ex.wbll);
			const html = layout.render({} as any, {} as any, Records.fields as any, placeholders, ex.isForm);

			if (html != ex.html) {
				++fails;

				log += `Placeholders:\n`
				for (const [key, value] of placeholders)
					log += `\t${key}: ${value || "EMPTY"}\n`;
				log += `\nForm:   ${ex.isForm}\nWBLL:   "${ex.wbll}"\nHTML:   "${ex.html}"\nActual: "${html}"\n\n`;
			}
		} catch (error) {
			++fails;
			log += `Error in WBLL: "${ex.wbll}"\n${error}\n\n`;
		}
	}
	await Deno.writeTextFile("./tests/wbll.test.log", log + (fails ? "" : "All tests passed!\n"));
	assertEquals(fails, 0, `${fails} test(s) failed!`);
});
