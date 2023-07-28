/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define([
  "N/record",
  "N/search",
  "N/runtime",
  "./Lib/serp_headlight_item_fulfillment.js",
], /**
 * @param{record} record
 * @param{search} search
 * @param runtime
 */ (record, search, runtime, helper) => {
  /**
   * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
   * @param {Object} inputContext
   * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {Object} inputContext.ObjectRef - Object that references the input data
   * @typedef {Object} ObjectRef
   * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
   * @property {string} ObjectRef.type - Type of the record instance that contains the input data
   * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
   * @since 2015.2
   */

  const getInputData = (inputContext) => {
    try {
      log.audit("GETINPUT", "*********GET INPUT DATA STARTED*********");
      let params = getParameters();
      log.debug("params", params);
      return JSON.parse(params.payload);
    } catch (e) {
      log.error("getInputData", e.message);
    }
  };

  const reduce = (context) => {
    let reduceObj = JSON.parse(context.values);
    log.debug("reduce", reduceObj);
    const soId = reduceObj["orders"][0].order_number;
    const itemsToUpdate = reduceObj["orders"][0]["order_items"];
    let params = getParameters();
    const BOLNumber = params.bolNumber;
    try {
      let updatedSOId = helper.updateSoBOLNumber({
        soId: soId,
        items: itemsToUpdate,
        BOL: BOLNumber,
      });
      log.audit("successfully update SO", updatedSOId);
    } catch (e) {
      log.error("reduce", e.message);
    }
  };

  /**
   * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
   * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
   * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
   * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
   *     script
   * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
   * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
   * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
   * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
   *     script
   * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
   * @param {Object} summaryContext.inputSummary - Statistics about the input stage
   * @param {Object} summaryContext.mapSummary - Statistics about the map stage
   * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
   * @since 2015.2
   */
  const summarize = (summaryContext) => {
    log.audit("SUMMARIZE", "*********EXECUTION FINISHED*********")
  };

  function getParameters() {
    const scriptObj = runtime.getCurrentScript();
    return {
      payload: scriptObj.getParameter({
        name: "custscript_serp_headlight_payload",
      }),
      bolNumber: scriptObj.getParameter({
        name: "custscript_serp_headlight_bol_number",
      }),
    };
  }

  return { getInputData, reduce, summarize };
});
