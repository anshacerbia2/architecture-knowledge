ALTER TABLE retrieval_units
  DROP CONSTRAINT IF EXISTS retrieval_units_unit_kind_check;

ALTER TABLE retrieval_units
  ADD CONSTRAINT retrieval_units_unit_kind_check CHECK (
    unit_kind IN (
      'concept-overview',
      'concept-section',
      'claim',
      'relationship',
      'source',
      'decision-guide-overview',
      'decision-guide-section'
    )
  );
