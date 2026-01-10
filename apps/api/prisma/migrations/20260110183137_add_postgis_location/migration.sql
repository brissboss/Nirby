-- Add PostGIS location column
ALTER TABLE "Poi" ADD COLUMN "location" geometry(Point, 4326);

-- Create spatial index for fast proximity queries
CREATE INDEX "Poi_location_idx" ON "Poi" USING GIST ("location");

-- Create trigger function to auto-update location from lat/lng
CREATE OR REPLACE FUNCTION update_poi_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on INSERT and UPDATE
CREATE TRIGGER poi_location_trigger
  BEFORE INSERT OR UPDATE ON "Poi"
  FOR EACH ROW
  EXECUTE FUNCTION update_poi_location();

-- Update existing POIs (if any)
UPDATE "Poi" SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) WHERE location IS NULL;
