import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { unquote } from "../common/unquote";

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  date: number;
  text?: string;
}

interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

@Injectable()
export class TelegramBotClient {
  private readonly logger = new Logger(TelegramBotClient.name);

  constructor(private readonly config: ConfigService) {}

  async getMe(): Promise<TelegramUser> {
    return this.call<TelegramUser>("getMe");
  }

  async sendMessage(payload: {
    chat_id: string;
    text: string;
    parse_mode?: "Markdown" | "HTML";
    disable_web_page_preview?: boolean;
  }): Promise<TelegramMessage> {
    return this.call<TelegramMessage>("sendMessage", payload);
  }

  private async call<T>(method: string, body?: Record<string, unknown>): Promise<T> {
    const token = unquote(this.config.getOrThrow("TELEGRAM_API_KEY"));
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : "{}",
    });

    const data = (await response.json()) as TelegramApiResponse<T>;
    if (!response.ok || !data.ok || data.result === undefined) {
      const description = data.description ?? `HTTP ${response.status}`;
      this.logger.error(`Telegram ${method} failed: ${description}`);
      throw new Error(`Telegram API error: ${description}`);
    }
    return data.result;
  }
}
