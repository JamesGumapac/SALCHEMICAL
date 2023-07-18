/**
 * @NApiVersion 2.1
 */
define(["N/record", "N/redirect", "N/search"]
/**
 * @param{record} record
 * @param{redirect} redirect
 * @param{search} search
 */, (record, redirect, search) => {
  /**
   * Get SOID based on headlight Id
   * @param headlightId
   * @return {null}
   */
  function searchForSOtoUpdate(headlightId) {
    try {
      let soId = null;
      const transactionSearchObj = search.create({
        type: "transaction",
        filters: [
          ["custbody_serp_headlight_order_id", "is", headlightId],
          "AND",
          ["status", "anyof", "SalesOrd:D", "SalesOrd:E", "SalesOrd:B"],
          "AND",
          ["mainline", "is", "T"],
        ],
      });

      transactionSearchObj.run().each(function (result) {
        soId = result.id;
        return true;
      });
      return soId;
    } catch (e) {
      log.error("searchForSOtoFulfill", e.message);
    }
  }

  function throwException(exceptionId) {
    const ERRORS = {
      ORDER_NO_NOT_FOUND:
        "The provided order no. {0} was either not found or was already shipped.",
      ITEM_COUNT_DOES_NOT_MATCH:
        "The number of items in the request is greater than the number of items in the Item Fulfillment.",
      ITEM_DOES_NOT_MATCH:
        "The item for headlightItemId {0} does not match the item in the Item Fulfillment.",
    };

    let message = ERRORS[exceptionId];
    for (let i = 1; i < arguments.length; i++) {
      message = message.replace("{" + (i - 1) + "}", arguments[i]);
    }
    throw {
      name: exceptionId,
      message: message,
    };
  }

  /**
   * Update SO BOL Number
   * @param {number}options.soId SO ID
   * @param {object}options.items
   * @param {string}options.BOL
   * @return {number} return the Updated SO ID
   */
  function updateSoBOLNumber(options) {
    try {
      log.debug("updateSoBOLNumber", options);
      let soRec;
      try {
        soRec = record.load({
          type: record.Type.SALES_ORDER,
          id: options.soId,
        });
      } catch (e) {
        log.error("Invalid SO Id", e.message);
      }

      if (!soRec) return;
      options.items.forEach((item) => {
        let lineIndex = soRec.findSublistLineWithValue({
          sublistId: "item",
          fieldId: "lineuniquekey",
          value: item.primary_key,
        });
        soRec.setSublistValue({
          sublistId: "item",
          fieldId: "custcol_serp_headlight_bol_num",
          line: lineIndex,
          value: options.BOL,
        });
      });

      return soRec.save({
        ignoreMandatoryFields: true,
      });
    } catch (e) {
      log.error("updateSoBOLNumber", e.message);
    }
  }

  return {
    searchForSOtoUpdate: searchForSOtoUpdate,
    updateSoBOLNumber: updateSoBOLNumber,
    throwException: throwException,
  };
});
