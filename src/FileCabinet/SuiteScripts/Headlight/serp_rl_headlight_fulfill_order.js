/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/https', 'N/record', 'N/runtime', 'N/search', "./Lib/serp_headlight_item_fulfillment", "./Lib/serp_headlight_create_service_logs"],
    /**
     * @param{https} https
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     * @param item_fulfillment_util
     */
    (https, record, runtime, search, item_fulfillment_util, serviceLog) => {
        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         *     content types)
         * @param {int} requestParams.headlight_id Headlight internal Id for SO
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const post = (requestParams) => {
            let response;
            let soId;

            try {

                soId = item_fulfillment_util.searchForSOtoFulfill(requestParams.headlight_id)
                if (!soId) {
                   return serviceLog.throwException('ORDER_NO_NOT_FOUND', requestParams.headlight_id);
                }
                response = {success: true, successMsg: 'Order is found with Internal Id ' + soId};
                serviceLog.headlightCreateServicelogs(
                    {
                        soId: soId,
                        serviceURL: null,
                        soapAction: "POST",
                        bodyRequest: requestParams,
                        responseCode: response,
                        responseHeader: null,
                        responseBody: response.successMsg ? response.successMsg : ""
                    }
                );
                return response
            } catch (ex) {
                log.error({title: ex.name, details: ex});
                response = {success: false, errorMsg: 'An unexpected error has occurred.'};
                let knownErrorIds = Object.keys(serviceLog.errorList());
                if (knownErrorIds.indexOf(ex.name) > -1) {
                    response.errorMsg = ex.message;
                } else if (ex.type === 'error.SuiteScriptError' || ex.name === 'USER_ERROR') {
                    response.errorMsg = ex.message;
                }

            }

            serviceLog.headlightCreateServicelogs(
                {
                    soId: null,
                    serviceURL: null,
                    soapAction: "POST",
                    bodyRequest: requestParams,
                    responseCode: response,
                    responseHeader: null,
                    responseBody: response ? response.errorMsg : ""
                }
            );
            return response
        }

        /**
         * Defines the function that is executed when a PUT request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body are passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */


        return {post}

    });
