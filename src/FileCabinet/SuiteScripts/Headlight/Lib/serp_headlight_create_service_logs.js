/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(["N/record"],

    function (record) {
        /**
         * Create API service logs.
         * @param {string} options.soId SO internal Id
         * @param {string} options.serviceURL Where the request is sent
         * @param {string} options.soapAction SOAP Action used
         * @param {string} options.bodyRequest Body request
         * @param {int} options.responseCode Returned Response Code
         * @param {string} options.responseHeader Returned header
         * @param {string} options.responseBody Returned body
         * @return {int} return service log Id
         */
        function headlightCreateServicelogs(options) {
            try {
                log.debug("headlightCreateServicelogs",options)
                let functionName = "createServiceLog";
                let serviceLogRec = record.create({
                    type: "customrecord_serp_headlight_service_logs",
                });
                serviceLogRec.setValue({
                    fieldId: "custrecord_serp_headlight_so_id",
                    value: options.soId,
                });
                serviceLogRec.setValue({
                    fieldId: "custrecord_serp_headlight_endpoint_url",
                    value: options.serviceURL,
                });
                serviceLogRec.setValue({
                    fieldId: "custrecord_serp_headlight_soap_action",
                    value: options.soapAction,
                });
                serviceLogRec.setValue({
                    fieldId: "custrecord_serp_headlight_body_request",
                    value: JSON.stringify(options.bodyRequest),
                });
                serviceLogRec.setValue({
                    fieldId: "custrecord_serp_headlight_response_code",
                    value: options.responseCode,
                });
                serviceLogRec.setValue({
                    fieldId: "custrecord_serp_headlight_res_header",
                    value: options.responseHeader,
                });
                serviceLogRec.setValue({
                    fieldId: "custrecord_serp_headlight_response_body",
                    value: options.responseBody,
                });

                let servicelogRecID = serviceLogRec.save();
                log.audit(functionName, "Service Log Created: " + servicelogRecID + " - soapAction: " + options.soapAction);
            } catch (e) {
                log.error("functionName", e.message)


            }
        }

        /**
         * Return error list
         * @return {{ORDER_NO_NOT_FOUND: string, ITEM_COUNT_DOES_NOT_MATCH: string, ITEM_DOES_NOT_MATCH: string}}
         */
        function errorList(){
            return {
                ORDER_NO_NOT_FOUND: 'The provided headlight Id: {0} was either not found or was already shipped.',
                ITEM_COUNT_DOES_NOT_MATCH: 'The number of items in the request is greater than the number of items in the Item Fulfillment.',
                ITEM_DOES_NOT_MATCH: 'The item for headlight Item Id: {0} does not match the item in the Item Fulfillment.'
            };
        }

        /**
         * Throw exception
         * @param exceptionId
         */
        function throwException(exceptionId) {
            let message = errorList()[exceptionId];
            for (let i = 1; i < arguments.length; i++) {
                message = message.replace('{' + (i - 1) + '}', arguments[i]);
            }
            throw {
                name: exceptionId,
                message: message
            };
        }


        return {
            headlightCreateServicelogs: headlightCreateServicelogs,
            throwException: throwException,
            errorList:errorList
        }
    });
