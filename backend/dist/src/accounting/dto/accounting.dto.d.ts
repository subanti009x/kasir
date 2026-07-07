export declare const EXPENSE_CATEGORIES: readonly ["RENT", "UTILITIES", "SALARIES", "MARKETING", "SUPPLIES", "OTHER"];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export declare class CreateExpenseDto {
    category: ExpenseCategory;
    description: string;
    amount: number;
    date: string;
}
export declare class DateRangeQueryDto {
    startDate?: string;
    endDate?: string;
}
export declare class AsOfDateQueryDto {
    asOfDate?: string;
}
