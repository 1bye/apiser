import { describe, test, expect } from "bun:test";
import { z, checkSchema } from "@/index";

describe("checkSchema", () => {
  describe("parse (default)", () => {
    test("parses valid input", () => {
      const schema = z.object({
        name: z.string(),
      });

      const result = checkSchema(schema, { name: "John" });

      expect(result).toEqual({ name: "John" });
    });

    test("throws on invalid input", () => {
      const schema = z.object({
        name: z.string(),
      });

      expect(() => checkSchema(schema, { name: 123 })).toThrow();
    });

    test("uses parse by default", () => {
      const schema = z.object({
        name: z.string(),
      });

      const result = checkSchema(schema, { name: "John" }, {});

      expect(result).toEqual({ name: "John" });
    });
  });

  describe("safeParse", () => {
    test("returns data on valid input", () => {
      const schema = z.object({
        name: z.string(),
      });

      const result = checkSchema(schema, { name: "John" }, {
        validationType: "safeParse",
      });

      expect(result).toEqual({ name: "John" });
    });

    test("returns undefined on invalid input", () => {
      const schema = z.object({
        name: z.string(),
      });

      const result = checkSchema(schema, { name: 123 }, {
        validationType: "safeParse",
      });

      expect(result).toBeUndefined();
    });
  });

  describe("with sources", () => {
    test("resolves field values from sources before parsing", () => {
      const schema = z.object({
        name: z.string().from("body"),
        id: z.string().from("params"),
      });

      const result = checkSchema(schema, {}, {
        sources: {
          body: { name: "John" },
          params: { id: "42" },
        },
      });

      expect(result).toEqual({ name: "John", id: "42" });
    });

    test("merges resolved values with input", () => {
      const schema = z.object({
        name: z.string().from("body"),
        age: z.number(),
      });

      const result = checkSchema(schema, { age: 30 }, {
        sources: {
          body: { name: "John" },
        },
      });

      expect(result).toEqual({ name: "John", age: 30 });
    });

    test("resolved values override input", () => {
      const schema = z.object({
        name: z.string().from("body"),
      });

      const result = checkSchema(schema, { name: "Original" }, {
        sources: {
          body: { name: "FromBody" },
        },
      });

      expect(result).toEqual({ name: "FromBody" });
    });

    test("resolves from handler.payload source", () => {
      const schema = z.object({
        prev: z.string().from("handler.payload", { key: "name" }),
      });

      const result = checkSchema(schema, {}, {
        sources: {
          "handler.payload": { name: "prev-value" },
        },
      });

      expect(result).toEqual({ prev: "prev-value" });
    });

    test("resolves from all source types", () => {
      const schema = z.object({
        search: z.string().from("query"),
        id: z.string().from("params"),
        name: z.string().from("body"),
        auth: z.string().from("headers", { key: "authorization" }),
        prev: z.string().from("handler.payload", { key: "name" }),
      });

      const result = checkSchema(schema, {}, {
        sources: {
          query: { search: "test" },
          params: { id: "42" },
          body: { name: "John" },
          headers: { authorization: "Bearer token" },
          "handler.payload": { name: "prev-value" },
        },
      });

      expect(result).toEqual({
        search: "test",
        id: "42",
        name: "John",
        auth: "Bearer token",
        prev: "prev-value",
      });
    });

    test("throws when resolved values fail validation", () => {
      const schema = z.object({
        name: z.string().from("body"),
      });

      expect(() => checkSchema(schema, {}, {
        sources: {
          body: { name: 123 },
        },
      })).toThrow();
    });

    test("works with safeParse and sources", () => {
      const schema = z.object({
        name: z.string().from("body"),
      });

      const result = checkSchema(schema, {}, {
        validationType: "safeParse",
        sources: {
          body: { name: "John" },
        },
      });

      expect(result).toEqual({ name: "John" });
    });

    test("safeParse returns undefined when resolved values fail", () => {
      const schema = z.object({
        name: z.string().from("body"),
      });

      const result = checkSchema(schema, {}, {
        validationType: "safeParse",
        sources: {
          body: { name: 123 },
        },
      });

      expect(result).toBeUndefined();
    });

    test("skips source resolution for non-object schemas", () => {
      const schema = z.string();

      const result = checkSchema(schema, "hello", {
        sources: {
          body: { name: "John" },
        },
      });

      expect(result).toBe("hello");
    });

    test("handles null input with sources", () => {
      const schema = z.object({
        name: z.string().from("body"),
      });

      const result = checkSchema(schema, null, {
        sources: {
          body: { name: "John" },
        },
      });

      expect(result).toEqual({ name: "John" });
    });

    test("works without sources option", () => {
      const schema = z.object({
        name: z.string(),
      });

      const result = checkSchema(schema, { name: "John" });

      expect(result).toEqual({ name: "John" });
    });
  });
});
