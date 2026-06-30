# Selling with Gumroad: a dead-simple guide

## What Gumroad is

Gumroad is a website that sells your digital files for you. You upload a file
(an Excel template, a PDF, a course), set a price, and Gumroad gives you a link.
When someone clicks that link, Gumroad takes their payment, delivers the file,
and emails them the receipt. You do nothing manual per sale.

Think of it as a checkout counter you rent: you stock the shelf (upload files,
set prices), and it handles money and delivery. You do not need a website store,
a payment processor, or any code. Our site just links to it.

## What it costs

- Free to open an account and list products.
- Gumroad takes a percentage of each sale (roughly 10% plus card fees). You keep
  the rest. No monthly fee on the free plan.
- You get paid out to your bank or PayPal.

## The one thing the site needs from you

For each product, Gumroad gives you a **product link** (a "permalink") that looks
like one of these:

    https://yourname.gumroad.com/l/dashboardkit
    https://gumroad.com/l/dashboardkit

That link is the only thing I need. Send me the link for each product and I wire
it in, then flip the store from "launching soon" to live.

## Step by step (about 10 minutes for the first one)

1. Go to **gumroad.com** and click **Start selling** / **Sign up**. Use your
   email. Confirm the email.
2. Fill in the basic account details it asks for (name, country). To actually
   receive money you will add a bank/PayPal under **Settings -> Payments** at
   some point, but you can create products before that.
3. Click **New product** (or **Products -> New product**).
   - Choose **Digital product**.
   - Name it exactly like the product on the site (list below).
   - Set the price (list below).
   - Click **Create**.
4. On the product page:
   - **Upload** the file(s) buyers receive (the Excel/PDF/course files).
   - Write a short description (you can copy the one from our product page).
   - Optional: add a cover image.
5. Click **Publish**.
6. Click **Share** or **Copy URL** to get the product link. That is the link to
   send me.
7. Repeat for each product. Send me all the links together in any format, for
   example: "Dashboard Kit -> https://...".

## The products to create (name and price to match the site)

| Product (name it this) | Price |
|---|---|
| Excel Finance Dashboard Kit | $39 |
| Month-End Close Checklist & Tracker | $29 |
| 3-Statement Financial Model | $49 |
| 13-Week Cash Flow Model | $29 |
| Budgeting & Forecasting Template Pack | $45 |
| Reconciliation Templates Bundle | $25 |
| Excel for Finance: From Basics to Dashboards | $149 |
| Excel Formulas Masterclass for Finance | $99 |
| Oracle Fusion Reporting Toolkit | $79 |
| ERP Implementation Document Pack | $119 |
| Oracle Fusion Financials: Practical Course | $249 |
| Excel Finance Template Bundle | $129 |
| OTBI + BI Publisher Report Pack | $149 |

You do not have to create all 13 at once. Start with the 2-3 products whose
files are ready, send those links, and I will turn just those on. The rest can
stay on the waitlist until their files exist.

## Tips

- Files first: you need the actual file to upload. No file, no product yet.
- You can change prices and files on Gumroad later without telling me; the link
  stays the same.
- For "courses", Gumroad can host video lessons, or you can start with a PDF plus
  template files and upgrade later.
- Keep the names close to the table above so the page and the checkout match.

## What I do once you send links

1. Put each link into `content/products.json`.
2. Flip `STORE_LIVE` to `true` in `lib/constants.ts`.
3. The "Notify me" buttons become "Get it" and go straight to your Gumroad
   checkout. Done.
