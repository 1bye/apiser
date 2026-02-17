import { describe, test } from "bun:test";
import z from "@apisr/zod";
import { checkSchema, type Infer, type IsZod } from "@/index";

// import Type from "@apisr/typebox";

describe("@apisr/schema", () => {
	describe("zod v4", () => {
		const zodSchema = z.object({
			name: z.string(),
			age: z.number(),
			skills: z.array(
				z.object({
					title: z.string(),
					primary: z.boolean(),
				})
			),
		});

		test("infer schema", () => {
			const infer: Infer<typeof zodSchema> = {};
			const isZod: IsZod<typeof zodSchema> = {};
		});

		test("checkSchema", () => {
			const schema = checkSchema(zodSchema, {
				name: "Hello world",
				age: 123,
				skills: [
					{
						title: "Talk",
						primary: true,
					},
				],
			});

			console.log(schema);
		});
	});

	// describe("typebox v1", () => {
	//   const typeboxSchema = Type.Object({
	//     name: Type.String(),
	//     age: Type.Number(),
	//     skills: Type.Array(
	//       Type.Object({
	//         title: Type.String(),
	//         primary: Type.Boolean()
	//       })
	//     )
	//   });

	//   test("infer schema", () => {
	//     const infer: Infer<typeof typeboxSchema> = {};
	//     const isTypebox: IsTypebox<typeof typeboxSchema> = {};
	//   });

	//   test("checkSchema", () => {
	//     const schema = checkSchema(typeboxSchema, {
	//       name: "Hello world",
	//       age: 123,
	//       skills: [{
	//         title: "Talk",
	//         primary: true
	//       }]
	//     });

	//     console.log(schema);
	//   });

	//   test("metadata", () => {
	//     const typeboxSchema = Type.Object({
	//       name: Type.String({
	//         from: "123"
	//       }),
	//       age: Type.Number(),
	//       skills: Type.Array(
	//         Type.Object({
	//           title: Type.String(),
	//           primary: Type.Boolean()
	//         })
	//       )
	//     });

	//     const Timestamp = Type.Codec(Type.Number())
	//       .Decode(value => new Date(value))
	//       .Encode(value => value.getTime())

	//     const T = Type.Object({
	//       date: Timestamp
	//     })

	//     const R = Value.Encode(T, {                         // const R = {
	//       date: new Date('1970-01-01T00:00:12.345Z')        //   date: 12345
	//     })

	//     console.log(typeboxSchema);
	//   });
	// });
});
