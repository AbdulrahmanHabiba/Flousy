import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const walletState = sqliteTable('wallet_state', {
 userId: text('user_id').primaryKey(), payload: text('payload').notNull(),
 revision: integer('revision').notNull().default(0),
});
