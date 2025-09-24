import { mergeRouters, createRouter } from "../createRouter";
import { productsRouter } from "./products";
import { customersRouter } from "./customers";
import { inventoryRouter } from "./inventory";
import { reportsRouter } from "./reports";
import { dashboardRouter } from "./dashboard";

export const appRouter = mergeRouters(
	createRouter({}),
	createRouter({ products: productsRouter }),
	createRouter({ customers: customersRouter }),
	createRouter({ inventory: inventoryRouter }),
	createRouter({ reports: reportsRouter }),
	createRouter({ dashboard: dashboardRouter }),
);

export type AppRouter = typeof appRouter; 