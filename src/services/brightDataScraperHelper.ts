import { Bindings } from "hono/types";
import { AppEnv } from "../../types/Env_types";



export const scrapeVideosByUrl = async (env: AppEnv, urls: string[], webhook_url: string) => {

    const data = JSON.stringify({
        input: urls.map(url => ({ url, country: "ID" })),
    });

    const params = new URLSearchParams({
        dataset_id: "gd_lu702nij2f790tmv9h",
        endpoint: webhook_url,
        notify: "false",
        format: "json",
        uncompressed_webhook: "true",
        force_deliver: "false",
        include_errors: "true"
    });

    await fetch(
    `https://api.brightdata.com/datasets/v3/trigger?${params.toString()}`,
    {
        method: "POST",
        headers: {
			"Authorization": `Bearer ${env.BDTOKENSECRET}`,
			"Content-Type": "application/json",
		},
		body: data,
    }
    );

    return { status: "ok", message: "Scraping has been submitted to brightdata" };
    
}