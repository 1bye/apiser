import type { HandlerFn } from "@/handler";
import type { HandlerRequest } from "@/handler/request";
import { Elysia, type Context } from "elysia";

export interface ElysiaCallback<TResult> {
  (ctx: Context): Promise<TResult>;
}


export interface ElysiaOptions {

}

export function elysia<TComponent extends HandlerFn.Component<any, any, any>>(component: TComponent): [
  ElysiaCallback<ReturnType<TComponent>>,
  ElysiaOptions
] {
  return [
    async ({ request: req, params, headers, query }) => {
      // TODO: Use different approach when working with form data (files)
      const formData = await req.formData();
      const request: HandlerRequest = {
        headers,
        params,
        query,
        url: req.url,
        body: formData as FormData
      };

      const response = await component.raw({
        request
      });

      return response as ReturnType<TComponent>;
    },
    {}
  ]
}
