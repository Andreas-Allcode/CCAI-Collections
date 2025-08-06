# CCAI Collections App

A Vite+React app for collections management with Supabase backend.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- AWS account (for deployment)

## Environment Setup

1. Create a `.env.local` file in the root directory:
```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

2. Get your Supabase credentials:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project or select existing
   - Go to Settings → API
   - Copy the Project URL and anon/public key

## Installation

```bash
npm install
```

## Running the app

```bash
# Development mode
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Database Setup

The app requires these Supabase tables:
- `portfolios` - Portfolio management
- `debts` - Debt records
- `debtors` - Debtor information
- `payments` - Payment tracking
- `vendors` - Vendor management
- `integrations` - Third-party integrations
- `campaigns` - Communication campaigns

Run the migrations in the `supabase/migrations/` folder.

## Deployment

### AWS S3 + CloudFront (Recommended)

1. Build the app:
```bash
npm run build
```

2. Deploy to S3:
```bash
# Create S3 bucket
aws s3 mb s3://your-bucket-name

# Upload files
aws s3 sync dist/ s3://your-bucket-name --delete

# Enable static website hosting
aws s3 website s3://your-bucket-name --index-document index.html --error-document index.html

# Make public
aws s3api put-public-access-block --bucket your-bucket-name --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

aws s3api put-bucket-policy --bucket your-bucket-name --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::your-bucket-name/*"
  }]
}'
```

3. (Optional) Add CloudFront for HTTPS:
   - Go to AWS CloudFront Console
   - Create distribution pointing to your S3 website URL
   - Enable "Redirect HTTP to HTTPS"

### Alternative: AWS Amplify Console

1. Push code to GitHub
2. Go to AWS Amplify Console
3. Connect GitHub repository
4. Add environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
5. Deploy automatically

## Features

- Portfolio management
- Debt tracking and collection
- Debtor management
- Payment processing
- Vendor management
- Communication campaigns
- Legal case tracking
- Reporting and analytics
- Third-party integrations

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: AWS S3 + CloudFront
- **Styling**: TailwindCSS + shadcn/ui components

For more information and support, please contact support.