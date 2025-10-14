import { mergeRouters, createRouter } from "../createRouter";
import { productsRouter } from "./products";
import { inventoryRouter } from "./inventory";
import { reportsRouter } from "./reports";
import { dashboardRouter } from "./dashboard";
import { salesRouter } from "./sales";
import { accountingRouter } from "./accounting";
import { fleetRouter } from "./fleet";
import { hrRouter } from "./hr";

export const appRouter = mergeRouters(
	createRouter({}),
	createRouter({ products: productsRouter }),
	createRouter({ inventory: inventoryRouter }),
	createRouter({ reports: reportsRouter }),
	createRouter({ dashboard: dashboardRouter }),
  createRouter({ sales: salesRouter }),
  createRouter({ accounting: accountingRouter }),
  createRouter({ fleet: fleetRouter }),
  createRouter({ hr: hrRouter }),
);

export type AppRouter = typeof appRouter; 