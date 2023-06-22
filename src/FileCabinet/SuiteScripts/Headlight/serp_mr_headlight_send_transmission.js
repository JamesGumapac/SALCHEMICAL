/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/runtime', 'N/search',"./Lib/serp_headlight_send_orders.js", "./Lib/serp_headlight_api_service.js", ],
    /**
     * @param{runtime} runtime
     * @param{search} search
     * @param add_order_util
     * @param APIService
     */
    (runtime, search, add_order_util, APIService) => {
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
                let ordersToBeUpdated = []
                let soId = null
                let params = getParameters()
                let orderObj = add_order_util.getPendingFulfillmentItem(params.soSearchId)
                const headlightIntegrationSettingId = params.headlightSettingId
                const headlightIntegrationSettings = add_order_util.getHeadlightIntegSettings(headlightIntegrationSettingId)

                let response = JSON.parse(APIService.addOrder({
                    soId, orderObj, headlightIntegrationSettings
                }));

                if (response.successfully_created_orders.length > 0) {
                    response.successfully_created_orders.forEach(data => ordersToBeUpdated.push({sucessfulOrders: data}))
                }
                if (response.failed_data.length > 0) {
                    let failedData = []
                    response.failed_data.forEach((obj) => failedData.push(obj))
                    failedData.forEach(data => ordersToBeUpdated.push({
                        failedOrders: data
                    }))

                }
                return ordersToBeUpdated


            } catch (e) {
                log.error("inputContext", e.message)
            }

        }


        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (context) => {
            try {
                let orderObj = JSON.parse(context.values)
                let status = Object.keys(orderObj)
                //update failed and successful line items
                status[0] === "sucessfulOrders" ?
                    add_order_util.updateSuccessfulOrder(orderObj.sucessfulOrders) :
                    add_order_util.updateSoFailedItem(orderObj.failedOrders)

            } catch (e) {
                log.error("reduce", e.message)
            }
        }


        function getParameters() {
            const scriptObj = runtime.getCurrentScript()
            return {
                headlightSettingId: scriptObj.getParameter({
                    name: "custscript_serp_headlight_integ_settings"
                }),
                soSearchId: scriptObj.getParameter({
                    name: "custscript_serp_headlight_pending_ful_se"
                }),
            }
        }

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
            const functionName = "summarize"
            log.audit(functionName, {
                UsageConsumed: summaryContext.usage,
                NumberOfQueues: summaryContext.concurrency,
                NumberOfYields: summaryContext.yields,
            });
            log.audit(functionName, "************ EXECUTION COMPLETED ************");
        }

        return {getInputData, reduce, summarize}

    });
