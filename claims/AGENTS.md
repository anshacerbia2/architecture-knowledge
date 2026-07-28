# Claim Instructions

Claims are first-class propositions, not copied sentences.

- Use the narrowest statement the cited evidence supports.
- Classify every claim as direct-source claim, normalized-source claim,
  synthesis, inference, recommendation, hypothesis, or opinion.
- Preserve scope, conditions, uncertainty, and material source qualifications.
- Direct and normalized claims cite sources. Synthesis and inference cite their
  inputs. Recommendations require both evidence and explicit conditions.
- Use `object.record_id` for a governed node and `object.literal` only when the
  object is not yet modeled as a durable node.
- Confidence describes support strength and must not be inferred from source
  count alone.
- Keep contradictory claims and connect them with a qualified
  `contradicted-by` relationship.
- Claims remain below human-reviewed lifecycle status unless an authorized human
  records the transition.
