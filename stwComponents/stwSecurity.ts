/**
 * Spin the Web Security
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2025 Giancarlo Trevisan
**/
import { STWSession } from "./stwSession.ts";

interface ISTWUser {
	user: string;
	name?: string;
	password?: string;
	roles: string;
	email: string;
}
export const STWSecurity = new class {
	addUser(_user: string, _name: string, _password: string, _roles: string): void { }

	removeUser(): void { }

	addRoles(_user: string, _roles: string): void { }

	removeRoles(_user: string, _roles: string): void { }

	authenticate(session: STWSession, user: string, password: string): void {
		if (user === "guest")
			return;

		const usersDB = Deno.env.get("SECURITY") || "./public/.data/users.json";
		const users: ISTWUser[] = JSON.parse(Deno.readTextFileSync(usersDB));

		const person = users.find(person => person.user === user);

		if (person?.user && person?.password === password) {
			session.user = person.user;
			session.roles = person.roles.split(",");
		} else {
			session.user = "guest";
			session.roles = ["guests"];
		}
	}

	lostPassword(): void { }

	changePassword(_session: STWSession, _user: string, _oldPassword: string, _newPassword: string, _force: boolean = false): void { }
}
