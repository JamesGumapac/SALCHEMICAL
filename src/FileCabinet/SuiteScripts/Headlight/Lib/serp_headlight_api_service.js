/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 */
define(["N/https", "./serp_headlight_create_service_logs"], /**
 *
 */ function (https, SERP_Headlight_ServiceLogs,) {
    /**
     * @param {int} options.recId Sales order Internal Id
     * @param {string} options.orderObj Created JSON Body string to send to Headlight
     * @param {object} options.headlightIntegrationSettings Record settings of Headlight
     * @returns {object} response from Headlight
     */
    function addOrder(options) {
        let params = null
        try {
            log.debug("addOrder orderbody", JSON.stringify(options.orderObj))
            const recId = options.recId
            const soapAction = "POST";
            let serviceURL = options.headlightIntegrationSettings.endpointURL + options.headlightIntegrationSettings.companyId + "/add_orders";
            const headers = {};
            headers["Content-Type"] = "application/json";
            headers["Authorization"] =
                "Token " + options.headlightIntegrationSettings.authorization;

            const headlightResponse = https.post({
                method: https.Method.POST,
                url: serviceURL,
                body: JSON.stringify(options.orderObj),
                headers: headers,
            });
            SERP_Headlight_ServiceLogs.headlightCreateServicelogs(
                {
                    soId: recId,
                    serviceURL: serviceURL,
                    soapAction: soapAction,
                    bodyRequest: options.orderObj,
                    responseCode: headlightResponse.code,
                    responseHeader: JSON.stringify(headlightResponse.headers),
                    responseBody: headlightResponse.body.substring(0, 100000)
                }
            );

            return headlightResponse.body;
        } catch (e) {
            log.error("addOrder", e.message);
        }
    }

    return {
        addOrder: addOrder,
    };
});
