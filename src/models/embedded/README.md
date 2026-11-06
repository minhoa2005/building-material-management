# Embedded schemas

Each `.model.js` declares one nested schema. These are fields inside one of the 59 parent collections, not extra MongoDB collections. Examples: `purchase-order-header`, `document-item`, `packaging`, `stock-movement`. Parent models import and attach them. Read [the current model guide](../README.md).
