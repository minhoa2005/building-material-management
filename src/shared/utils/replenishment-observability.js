import { channel } from 'node:diagnostics_channel';

// Subscribe from deployment instrumentation. Never emit request bodies, document
// identifiers, warehouse scope, quantities, prices or exception messages.
const events = channel('wmsd.replenishment');
export function observePlanning(event, fields = {}) {
  if (events.hasSubscribers) events.publish({ event, ...fields });
}
