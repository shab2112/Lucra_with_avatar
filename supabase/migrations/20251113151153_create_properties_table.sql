/*
  # Create Properties Table

  1. New Tables
    - `properties`
      - `id` (uuid, primary key) - Unique identifier for each property
      - `title` (text) - Property listing title
      - `price` (numeric) - Property price
      - `bedrooms` (integer) - Number of bedrooms
      - `bathrooms` (integer) - Number of bathrooms
      - `sqft` (integer) - Square footage
      - `address` (text) - Street address
      - `city` (text) - City name
      - `lat` (numeric) - Latitude coordinate
      - `lng` (numeric) - Longitude coordinate
      - `image_url` (text) - Property image URL
      - `description` (text) - Property description
      - `property_type` (text) - Type of property (e.g., Apartment, House, Condo)
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `properties` table
    - Add policy for anyone to read property data (public listing data)
*/

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  price numeric NOT NULL,
  bedrooms integer NOT NULL DEFAULT 0,
  bathrooms integer NOT NULL DEFAULT 0,
  sqft integer NOT NULL DEFAULT 0,
  address text NOT NULL,
  city text NOT NULL DEFAULT '',
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  image_url text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  property_type text NOT NULL DEFAULT 'Apartment',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Properties are publicly readable"
  ON properties FOR SELECT
  TO anon, authenticated
  USING (true);