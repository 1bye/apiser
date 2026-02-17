import { z } from "@apisr/zod";
import { endpoint } from "@/endpoint";

const main = endpoint({
	path: "/index.php",
	querySchema: z.object({
		resource: z.literal("alertos"),
	}),
	probe: {
		200: {
			query: {
				resource: "alertos",
			},
		},
	},
});
