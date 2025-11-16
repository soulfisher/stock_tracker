import { inngest } from "@/lib/inngest/client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "@/lib/inngest/prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { formatDateToday } from "@/lib/utils";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const userProfile = `
    - Country: ${event.data.country},
    - Investment goals: ${event.data.investmentGoals},
    - Risk tolerance: ${event.data.riskTolerance},
    - Preferred industry: ${event.data.preferredIndustry}`;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile,
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
    });

    await step.run("send-welcome-intro", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.";

      const {
        data: { email, name },
      } = event;
      return await sendWelcomeEmail({
        email,
        name,
        intro: introText,
      });
    });

    return { success: true, message: "Welcome email sent successfully" };
  },
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],
  async ({ step }) => {
    // Step #1: Get all users for news delivery
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);

    if (!users || users.length === 0)
      return { success: false, message: "No users found for news email" };

    // Step #2: Fetch personalized news for each user
    const userNewsData = await step.run("fetch-user-news", async () => {
      const results = [];

      for (const user of users) {
        try {
          // Get user's watchlist symbols
          const symbols = await getWatchlistSymbolsByEmail(user.email);

          // Fetch news based on watchlist (or general if empty)
          const news = await getNews(symbols);

          results.push({
            user,
            news,
            hasWatchlist: symbols.length > 0,
          });
        } catch (error) {
          console.error(`Error fetching news for user ${user.email}:`, error);
          // Continue to next user on error
        }
      }

      return results;
    });

    // Step #3: Summarize news via AI for each user
    // Placeholder for AI summarization
    const userNewsSummaries: { user: User; newsContent: string | null }[] = [];

    for (const { user, news } of userNewsData) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsData}}",
          JSON.stringify(news, null, 2),
        );

        const response = await step.ai.infer(`summarize-news-${user.email}`, {
          model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
          body: {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const newsContent =
          (part && "text" in part ? part.text : null) || "No market news";

        userNewsSummaries.push({ user, newsContent });
      } catch (error) {
        console.error("Failed to summarize news for: ", user.email);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    // Step #4: Send emails
    // Placeholder for email sending
    await step.run("send-emails", async () => {});
    await Promise.all(
      userNewsSummaries.map(async ({ user, newsContent }) => {
        if (!newsContent) return false;

        return await sendNewsSummaryEmail({
          email: user.email,
          date: formatDateToday,
          newsContent,
        });
      }),
    );
    return {
      success: true,
      message: "Daily news summary emails sent successfully",
    };
  },
);
