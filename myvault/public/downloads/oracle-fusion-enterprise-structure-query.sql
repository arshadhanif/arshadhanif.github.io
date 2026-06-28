-- Oracle Fusion Cloud: Enterprise Structure Query
-- Retrieves all primary ledgers with their legal entities, business units,
-- corporate FA books, and inventory organisations in a single run.
-- Validated across single-entity, multi-entity, single-COA and multi-COA setups.
-- Source: ERP Finance Pro (arshadhanif.github.io/myvault)

SELECT
    gl.ledger_id,
    gl.name                          AS ledger_name,
    gl.short_name                    AS ledger_short_name,
    gl.ledger_category_code          AS ledger_category,
    gl.currency_code                 AS ledger_currency,
    gl.period_set_name               AS accounting_calendar,
    gl.chart_of_accounts_id          AS coa_id,
    coa_b.id_flex_structure_code     AS coa_code,
    coa_tl.id_flex_structure_name    AS coa_name,
    gl.enable_budgetary_control_flag AS bc_enabled,
    le.legal_entity_id,
    le.name                          AS legal_entity_name,
    le.legal_entity_identifier       AS legal_entity_code,
    le.effective_from                AS le_effective_from,
    le.effective_to                  AS le_effective_to,
    hou.organization_id              AS business_unit_id,
    hou.name                         AS business_unit_name,
    fbc.book_type_code               AS asset_book_code,
    fbc.book_class                   AS asset_book_class,
    iop.organization_id              AS inv_org_id,
    iop.organization_code            AS inv_org_code,
    hou2.name                        AS inv_org_name
FROM
    fusion.gl_ledgers                     gl
    JOIN fusion.gl_ledger_le_v            llv ON llv.ledger_id = gl.ledger_id
    JOIN fusion.xle_entity_profiles       le  ON le.legal_entity_id = llv.legal_entity_id
    JOIN fusion.fnd_id_flex_structures_tl coa_tl
        ON coa_tl.id_flex_num    = gl.chart_of_accounts_id
       AND coa_tl.id_flex_code   = 'GL#'
       AND coa_tl.application_id = 101
       AND coa_tl.language       = 'US'
    JOIN fusion.fnd_id_flex_structures    coa_b
        ON coa_b.id_flex_num     = gl.chart_of_accounts_id
       AND coa_b.id_flex_code    = 'GL#'
       AND coa_b.application_id  = 101
    LEFT JOIN fusion.hr_operating_units   hou ON hou.set_of_books_id = gl.ledger_id
    LEFT JOIN fusion.fa_book_controls     fbc
        ON fbc.set_of_books_id   = gl.ledger_id
       AND fbc.book_class        = 'CORPORATE'
       AND fbc.date_ineffective IS NULL
    LEFT JOIN fusion.inv_org_parameters   iop ON iop.business_unit_id = hou.organization_id
    LEFT JOIN fusion.hr_operating_units   hou2 ON hou2.organization_id = iop.organization_id
WHERE
    gl.ledger_category_code = 'PRIMARY'
    AND gl.object_type_code = 'L'
ORDER BY
    gl.name, le.name, hou.name, fbc.book_type_code, iop.organization_code;
