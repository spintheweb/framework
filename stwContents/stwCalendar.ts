/**
 * Spin the Web Calendar content
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/
import { STWFactory, STWSession } from "../stwComponents/stwSession.ts";
import { STWContent, ISTWContent } from "../stwElements/stwContent.ts";
import { STWLayout } from "../stwContents/wbll.ts";
import { ISTWRecords } from "../stwComponents/stwDatasources.ts";

export class STWCalendar extends STWContent {
    public constructor(content: ISTWContent) {
        super(content);
    }

    public override async render(request: Request, session: STWSession, records: ISTWRecords): Promise<string> {
        let layout = this.getLayout(session);
        const period = layout.settings.get("period") || "monthly";
        const datetimeKey = layout.settings.get("key") || "date";
        const today = layout.settings.get("date") ? new Date(layout.settings.get("date")) : new Date();

        const fields = records.fields?.map(f => f.name) || Object.keys(records.rows?.[0] || {});
        if (!layout.hasTokens) {
            this.layout.set(session.lang, new STWLayout(layout.wbll + "lf".repeat(fields.length)));
            layout = this.getLayout(session);
        }

        const placeholders = new Map(session.placeholders);

        // Index records by date (day or hour)
        const recordMap: Record<string, any[]> = {};
        for (const row of records.rows || []) {
            const dt = row[datetimeKey] ? new Date(row[datetimeKey]) : null;
            if (!dt || isNaN(dt.getTime())) continue;
            let key = "";
            if (period === "monthly" || period === "weekly") {
                key = dt.toISOString().slice(0, 10); // YYYY-MM-DD
            } else if (period === "daily") {
                key = dt.toISOString().slice(0, 13); // YYYY-MM-DDTHH
            }
            if (!recordMap[key]) recordMap[key] = [];
            recordMap[key].push(row);
        }

        let body = `<div class="stw${capitalize(period)} stwCalendar">`;

        if (period === "monthly") {
            const year = today.getFullYear();
            const month = today.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const firstWeekday = firstDay.getDay(); // 0=Sunday, 1=Monday, ...
            const daysInMonth = lastDay.getDate();

            const locale = session.lang || "en";
            const weekDays = [];
            const baseDate = new Date(2020, 5, 7); // Sunday
            for (let i = 0; i < 7; i++) {
                const day = new Date(baseDate);
                day.setDate(baseDate.getDate() + i);
                weekDays.push(day.toLocaleDateString(locale, { weekday: "short" }));
            }
            const monthName = today.toLocaleDateString(locale, { month: "long", year: "numeric" });

            body += `<div class="stwCalendarMonthHeader">${monthName}</div>`;
            body += `<table class="stwCalendarTable"><thead><tr>`;
            for (const wd of weekDays) body += `<th>${wd}</th>`;
            body += `</tr></thead><tbody><tr>`;

            // Fill initial empty cells
            for (let i = 0; i < firstWeekday; i++) body += `<td></td>`;

            for (let day = 1; day <= daysInMonth; day++) {
                const dateObj = new Date(year, month, day);
                const dateStr = dateObj.toISOString().slice(0, 10);
                const isToday = dateStr === (new Date()).toISOString().slice(0, 10);
                body += `<td${isToday ? ' class="stwCalendarToday"' : ''}><span class="stwCalendarDayNum">${day}</span>`;
                for (const row of recordMap[dateStr] || []) {
                    const rowPlaceholders = new Map(placeholders);
                    for (const [name, value] of Object.entries(row))
                        rowPlaceholders.set(`@@${name}`, String(value));
                    body += `<div class="stwCalendarRecord">` +
                        await layout.render(request, session, fields, rowPlaceholders) +
                        `</div>`;
                }
                body += `</td>`;
                // If end of week, close row and start new
                if ((firstWeekday + day) % 7 === 0 && day !== daysInMonth) body += `</tr><tr>`;
            }

            // Fill trailing empty cells
            const trailing = (firstWeekday + daysInMonth) % 7;
            if (trailing !== 0) for (let i = trailing; i < 7; i++) body += `<td></td>`;
            body += `</tr></tbody></table>`;
        } else if (period === "weekly") {
            // Determine first day of week based on session language/locale
            const firstDayOfWeek = getFirstDayOfWeek(session.lang || "en");
            const weekStart = new Date(today);
            // Calculate offset from today to the first day of the week
            const offset = (today.getDay() - firstDayOfWeek + 7) % 7;
            weekStart.setDate(today.getDate() - offset);
            for (let i = 0; i < 7; i++) {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + i);
                const dateStr = day.toISOString().slice(0, 10);
                body += `<div class="stwCalendarGroup" data-group="${dateStr}"><div class="stwCalendarDayHeader">${dateStr}</div>`;
                for (const row of recordMap[dateStr] || []) {
                    const rowPlaceholders = new Map(placeholders);
                    for (const [name, value] of Object.entries(row))
                        rowPlaceholders.set(`@@${name}`, String(value));
                    body += await layout.render(request, session, fields, rowPlaceholders);
                }
                body += `</div>`;
            }
        } else if (period === "daily") {
            const dateStr = today.toISOString().slice(0, 10);
            for (let h = 0; h < 24; h++) {
                const hourStr = `${dateStr}T${String(h).padStart(2, "0")}`;
                body += `<div class="stwCalendarGroup" data-group="${hourStr}"><div class="stwCalendarHourHeader">${hourStr}:00</div>`;
                for (const row of recordMap[hourStr] || []) {
                    const rowPlaceholders = new Map(placeholders);
                    for (const [name, value] of Object.entries(row))
                        rowPlaceholders.set(`@@${name}`, String(value));
                    body += await layout.render(request, session, fields, rowPlaceholders);
                }
                body += `</div>`;
            }
        }

        body += `</div>`;
        return body;

        function capitalize(str: string) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
    }
}

function getFirstDayOfWeek(locale: string): number {
    // Sunday = 0, Monday = 1, etc.
    // Common mapping, can be extended as needed
    const sundayLocales = ["en-US", "en-CA", "en-AU", "en-PH", "zh-CN", "ja-JP"];
    if (sundayLocales.some(l => locale.startsWith(l.split("-")[0]))) return 0;
    // Most of Europe, ISO 8601, etc. use Monday
    return 1;
}

STWFactory.Calendar = STWCalendar;
