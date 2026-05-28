# Custom GPT FB Dashboard

Vercel-ready starter for a Facebook business assistant with:

- Facebook inbox/comment webhook receiver
- Report dashboard for page comments and ads insights
- Meta Ads pause/resume/update API endpoints
- OpenAI reply helper for future automation

## Environment Variables

Copy `.env.example` to `.env.local` for local testing, then add the same values in Vercel.

```txt
META_VERIFY_TOKEN=your-webhook-verify-token
META_PAGE_ACCESS_TOKEN=your-page-access-token
META_PAGE_ID=your-facebook-page-id
META_AD_ACCOUNT_ID=act_your_ad_account_id
META_API_VERSION=v20.0
OPENAI_API_KEY=your-openai-key
AI_MODEL=gpt-4.1-mini
GPT_ACTION_SECRET=make-a-long-random-secret
```

## Deploy

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the environment variables.
4. Set the Meta webhook URL to:

```txt
https://your-project.vercel.app/api/webhook
```

5. Open the dashboard:

```txt
https://your-project.vercel.app/dashboard
```

## Meta Permissions

For page message/comment reporting:

- `pages_manage_metadata`
- `pages_read_engagement`
- `pages_manage_engagement`
- `pages_messaging`

For ads reports and controls:

- `ads_read`
- `ads_management`

Live production access usually requires Meta App Review.

## API Routes

- `GET /api/reports/summary` returns last 7 days ad insights and recent post comments.
- `GET /api/ads` returns recent ads from the configured ad account.
- `PATCH /api/ads/:adId` accepts `{ "status": "PAUSED" }` or `{ "status": "ACTIVE" }`.
- `GET /api/webhook` handles Meta webhook verification.
- `POST /api/webhook` receives inbox and page feed events.
- `GET /api/gpt/openapi` returns the Custom GPT Actions OpenAPI schema.
- `GET /api/gpt/summary` returns protected GPT-readable business data.
- `PATCH /api/gpt/ads/:adId` lets a GPT pause or resume ads.
- `POST /api/gpt/comments/:commentId/reply` lets a GPT reply to a comment.

## Custom GPT Setup

Create a Custom GPT and add an Action:

1. Open the GPT editor.
2. Go to Actions and create a new action.
3. Import the schema from:

```txt
https://your-project.vercel.app/api/gpt/openapi
```

4. Set authentication to API Key.
5. Choose custom header.
6. Header name:

```txt
x-gpt-action-secret
```

7. Secret value: use the same value as `GPT_ACTION_SECRET` in Vercel.

Suggested GPT instruction:

```txt
You are Nextvolt's Facebook business operations assistant.

You can read Facebook posts, comments, ad reports, and ad status using the available actions.
You can draft replies to Facebook comments in Bangla, English, or Banglish based on the customer's language.

Before publishing a comment reply, pausing an ad, resuming an ad, or changing anything, always show the exact action and ask for confirmation.
Never invent prices, stock, delivery promises, warranties, payment confirmation, or technical specifications.
If product price or stock is not available in the data, ask the admin for the missing detail.
For angry customers, complaints, refund/payment issues, or legal threats, recommend human follow-up instead of replying automatically.
Keep customer replies short, polite, and sales-focused.
```

## Current Limit

This is the first deployable control panel. For real production use, add admin login before exposing ad pause/resume controls.
