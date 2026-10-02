import { NextResponse } from "next/server";
import { getRepo } from "@/lib/db";
import { handle } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = handle(async () => NextResponse.json(await (await getRepo()).listProducts()));
