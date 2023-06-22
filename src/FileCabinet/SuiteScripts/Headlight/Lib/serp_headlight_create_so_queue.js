/**
 * @NApiVersion 2.1
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
     */
    (record, search) => {
        /**
         * @param soId Internal Id of the SO
         * @return {boolean} return if the SO has an existing queue record
         */
        function validateSOIsInQueue(soId) {
            try {

                const customrecord_serp_headlight_pending_tranSearchObj = search.create({
                    type: "customrecord_serp_headlight_pending_tran",
                    filters:
                        [
                            ["custrecord_serp_headlight_so_pending_id", "anyof", soId]
                        ],

                });
                return customrecord_serp_headlight_pending_tranSearchObj.runPaged().count > 0
            } catch (e) {
                log.error("validateSOIsInQueue", e.message)
            }
        }

        /**
         * Create Queue if not yet existing
         * @param soId
         */
        function createQueue(soId) {
            try {

                const queueRec = record.create({
                    type: "customrecord_serp_headlight_pending_tran",
                })
                queueRec.setValue({
                    fieldId: "custrecord_serp_headlight_so_pending_id",
                    value: soId
                })
                return queueRec.save({
                    ignoreMandatoryFields: true
                })
            } catch (e) {
                log.error("createQueue", e.message)
            }
        }

        return {
            validateSOIsInQueue,
            createQueue
        }

    });
