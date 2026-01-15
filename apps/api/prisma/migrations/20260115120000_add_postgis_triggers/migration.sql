-- Create function for location trigger
CREATE OR REPLACE FUNCTION update_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Poi table
CREATE TRIGGER poi_location_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude ON "Poi"
FOR EACH ROW
EXECUTE FUNCTION update_location();

-- Trigger for GooglePlaceCache table
CREATE TRIGGER google_place_cache_location_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude ON "GooglePlaceCache"
FOR EACH ROW
EXECUTE FUNCTION update_location();

-- Create spatial indexes for performance
CREATE INDEX IF NOT EXISTS "Poi_location_idx" ON "Poi" USING GIST ("location");
CREATE INDEX IF NOT EXISTS "GooglePlaceCache_location_idx" ON "GooglePlaceCache" USING GIST ("location");