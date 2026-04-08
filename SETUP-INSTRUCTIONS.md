# Silver Butterfly Brooch - Setup Instructions

## ✅ Configuration Status

### What's Working ✅
- **BREVO_API_KEY** - Correctly configured in `.env`
- **SUPABASE_URL** - Correctly configured in `.env`
- **SUPABASE_ANON_KEY** - Correctly configured in `.env`
- **API Endpoints** - CORS fixed, endpoint logic working
- **Frontend Form** - Form validation and submission working

### What's Missing ❌
- **`reservations` table in Supabase** - DOES NOT EXIST!

---

## 🔧 Required Setup Steps

### Step 1: Create Reservations Table in Supabase

1. **Go to your Supabase Dashboard:**
   - URL: https://app.supabase.com
   - Project: `avfrbimgivroejozcxpi`

2. **Open SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy and paste this SQL:**
   ```sql
   CREATE TABLE IF NOT EXISTS public.reservations (
     id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
     full_name text NOT NULL,
     email text NOT NULL,
     phone text NOT NULL,
     city text,
     discount_code text NOT NULL UNIQUE,
     expiry_date date NOT NULL,
     source text DEFAULT 'silver',
     ip_address text,
     email_sent_at timestamp with time zone,
     created_at timestamp with time zone NOT NULL DEFAULT now(),
     updated_at timestamp with time zone NOT NULL DEFAULT now()
   );

   ALTER TABLE public.reservations ADD CONSTRAINT unique_email UNIQUE (email);
   ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Allow public insert" ON public.reservations
     FOR INSERT WITH CHECK (true);

   CREATE POLICY "Allow public select" ON public.reservations
     FOR SELECT USING (true);

   CREATE INDEX IF NOT EXISTS idx_reservations_email ON public.reservations(email);
   CREATE INDEX IF NOT EXISTS idx_reservations_discount_code ON public.reservations(discount_code);
   ```

4. **Click "Run"** (or press Cmd+Enter / Ctrl+Enter)

5. **Verify success** - You should see: "Query executed successfully"

---

### Step 2: Verify in Supabase

1. **Go to Table Editor** in left sidebar
2. **Look for `reservations` table** - Should be visible in the list
3. **Click on it** - Should show empty table with columns:
   - id, full_name, email, phone, city, discount_code, expiry_date, source, ip_address, email_sent_at, created_at, updated_at

---

### Step 3: Test Form Submission

1. **Go to:** https://silver.expostores.com
2. **Click:** "PRE-ORDER NOW" or "UNLOCK EARLY ACCESS"
3. **Fill form with:**
   - Full Name: Your Name
   - Email: your-email@example.com
   - WhatsApp: +919876543210
   - City: Your City
   - How did you hear: Instagram

4. **Click:** "RESERVE MY SPOT NOW"

5. **Expected result:**
   - ✅ Success modal appears
   - ✅ Discount code displayed (LAUNCH-xxxxx)
   - ✅ Email sent to your inbox
   - ✅ Record saved in Supabase

---

## 📧 Email Configuration

**BREVO_API_KEY is already set in your `.env`**

To test email sending:
1. Form submission sends email via Brevo API
2. Email includes:
   - Discount code
   - Original price: ₹12,850
   - Your price: ₹6,425 (50% off)
   - Expiry date (7 days)
3. Check spam folder if email doesn't arrive

---

## 🔐 Environment Variables (.env)

Your `.env` file is correctly configured with:

```
BREVO_API_KEY=xkeysib-[YOUR_API_KEY]
SUPABASE_URL=https://avfrbimgivroejozcxpi.supabase.co
SUPABASE_ANON_KEY=sb_publishable_[YOUR_KEY]
SUPABASE_SERVICE_KEY=[YOUR_SERVICE_KEY]
DATABASE_URL=postgresql://[YOUR_CONNECTION_STRING]
NODE_ENV=production
```

✅ **All credentials are correctly set in your local `.env` file!**

> ⚠️ **Security Note:** Never commit the `.env` file with real API keys to GitHub. Use GitHub Secrets for production deployments.

---

## 🧪 Local Testing

To test locally:

```bash
cd c:/silver-fresh
node server.js
```

Then visit: http://localhost:5432

---

## 📊 Database Schema

```
reservations table:
├── id (uuid, primary key)
├── full_name (text)
├── email (text, unique)
├── phone (text)
├── city (text)
├── discount_code (text, unique)
├── expiry_date (date)
├── source (text, default: 'silver')
├── ip_address (text)
├── email_sent_at (timestamp)
├── created_at (timestamp, auto)
└── updated_at (timestamp, auto)
```

---

## ✅ Checklist

- [ ] Created `reservations` table in Supabase
- [ ] Table appears in Supabase Table Editor
- [ ] Tested form submission on silver.expostores.com
- [ ] Received confirmation email
- [ ] Discount code generated correctly
- [ ] Record appears in Supabase console

Once you complete Step 1 (create the table), the form should work perfectly! 🎉
