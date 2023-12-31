/**
 * @NApiVersion 2.1
 */
define([
  "N/record",
  "N/runtime",
  "N/search",
  "N/format",
  "./serp_headlight_api_service.js",
], /**
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{format} format,
 * @param{*} SERP_Headlight_APIService
 */ function (record, runtime, search, format, SERP_Headlight_APIService) {
  /**
   * Get the record information and SO details and create an object with it that will be used in sending request
   * @param {string} options.recId Record Id
   * @returns {object} return record object information
   */

  // function getOrderDetails(options) {
  //   try {
  //     const soRec = record.load({
  //       type: record.Type.SALES_ORDER,
  //       id: options.recId,
  //       isDynamic: true,
  //     });
  //
  //     const shipSubRecord = soRec.getSubrecord({
  //       fieldId: "shippingaddress",
  //     });
  //
  //     let dropOffAddress = `${shipSubRecord.getValue(
  //       "addr1"
  //     )},  ${shipSubRecord.getValue("city")}, ${shipSubRecord.getValue(
  //       "state"
  //     )}    ${shipSubRecord.getValue("zip")} `;
  //     let orderInfo = {};
  //     orderInfo.orders = [];
  //     for (let i = 0; i < soRec.getLineCount("item"); i++) {
  //       const lineUniqueKey = soRec.getSublistValue({
  //         sublistId: "item",
  //         fieldId: "lineuniquekey",
  //         line: i,
  //       });
  //       const itemId = soRec.getSublistValue({
  //         sublistId: "item",
  //         fieldId: "item",
  //         line: i,
  //       });
  //       const itemName = soRec.getSublistText({
  //         sublistId: "item",
  //         fieldId: "item",
  //         line: i,
  //       });
  //       const expectedShipDate = soRec.getSublistText({
  //         sublistId: "item",
  //         fieldId: "expectedshipdate",
  //         line: i,
  //       });
  //
  //       const quantity = soRec.getSublistValue({
  //         sublistId: "item",
  //         fieldId: "quantity",
  //         line: i,
  //       });
  //       let quantityfulfilled = 0;
  //       quantityfulfilled = soRec.getSublistValue({
  //         sublistId: "item",
  //         fieldId: "quantityfulfilled",
  //         line: i,
  //       });
  //       const description = soRec.getSublistValue({
  //         sublistId: "item",
  //         fieldId: "description",
  //         line: i,
  //       });
  //       orderInfo.orders.push({
  //         remote_order_header_id: options.recId,
  //         order_number: soRec.getValue("tranid"),
  //         order_type: "sale",
  //         ship_date: expectedShipDate || null,
  //         earliest_ship_date: null,
  //         customer: soRec.getText("entity") || null,
  //         vendor: null,
  //         dropoff_address: dropOffAddress,
  //         pickup_address: null,
  //         delivery_window_start: null,
  //         delivery_window_end: null,
  //         appointment_time: null,
  //         stop_time: null,
  //         order_comments: soRec.getValue("memo") || null,
  //         ship_rules: null,
  //         bin_ship_rules: "",
  //         shipping_constraints: null,
  //         hold_code: null,
  //         bol_number: null,
  //         bol_stop_number: null,
  //         selected: null,
  //         remote_order_item_id: lineUniqueKey,
  //         line_number: i + 1,
  //         description: description || null,
  //         part_name: itemName || null,
  //         part_number: null,
  //         unique_bin_part_number: null,
  //         inventory_status: null,
  //         quantity: quantity - quantityfulfilled || null,
  //         weight: null,
  //         width: null,
  //         length: null,
  //       });
  //     }
  //     orderInfo.delete_orders = true;
  //     log.debug("order obj", orderInfo);
  //     return orderInfo;
  //   } catch (e) {
  //     log.error("getOrderDetails", e.message);
  //   }
  // }

  /**
   * Return SalesOrder that is Pending Fulfillment/Partially Fulfilled
   * @param {string} options.searchId Saved Search Id for Pending fulfillment
   * @param {boolean} options.deleteOrders Integration Settings to Delete Orders if new batch of orders will be send
   * @return {object} return all of the line combined in one object that will be use to send to headlight
   */
  function getPendingFulfillmentItem(options) {
    try {
      log.audit("getPendingFulfillmentItem", options);
      let orderInfo = {};
      orderInfo.orders = [];
      const salesorderSearchObj = search.load({
        id: options.searchId,
      });
      let x = 0;
      salesorderSearchObj.run().each(function (result) {
        let trandate = result.getValue("trandate");
        let shipDate = result.getValue("shipdate");
        let state = result.getValue({
          name: "state",
          join: "shippingAddress",
        });
        let zip = result.getValue({
          name: "zip",
          join: "shippingAddress",
        });
        let city = result.getValue({
          name: "city",
          join: "shippingAddress",
        });
        let street1 = result.getValue({
          name: "address1",
          join: "shippingAddress",
        });
        let street2 = result.getValue({
          name: "address2",
          join: "shippingAddress",
        });
        let length = 0;
        let width = 0;
        let numOfPallet = result.getValue("custcol_no_of_pallets") || 0;
        length = numOfPallet * 48;
        width = numOfPallet * 40;
        let street = street1 ? street1 : street2;
        let shippingAdrees = `${street}, ${city}, ${state}, ${zip}`;
        let customAddressField = result
          .getValue("custbody_customaddress_body_field")
          .replace(/(\r\n|\n|\r)/gm, "");
        let prodShip = result
          .getValue("custbody_sal_prod_ship_ins")
          .replace(/(\r\n|\n|\r)/gm, "");
        x += 1;

        if (x > 179)
          orderInfo.orders.push({
            remote_order_header_id: `${result.getValue(
              "internalid"
            )}-${result.getValue("lineuniquekey")}`,
            order_number: result.getValue("tranid"),
            order_type: "sale",
            ship_date: shipDate || trandate,
            earliest_ship_date: null,
            customer: result.getText("entity") || null,
            vendor: null,
            dropoff_address: shippingAdrees,
            pickup_address: null,
            delivery_window_start: shipDate || trandate,
            delivery_window_end:
              addWeekToDate(new Date(shipDate)) ||
              addWeekToDate(new Date(trandate)),
            appointment_time: null,
            stop_time: null,
            order_comments: `${customAddressField} - ${prodShip}` || null,
            ship_rules: null,
            bin_ship_rules: "",
            shipping_constraints: null,
            hold_code: null,
            bol_number: null,
            bol_stop_number: null,
            selected: null,
            remote_order_item_id:
              result.getValue("lineuniquekey") +
              "-" +
              result.getValue("linesequencenumber"),
            line_number: result.getValue("linesequencenumber"),
            description: result.getValue("memo") || null,
            part_name: result.getText("item") || null,
            part_number: null,
            unique_bin_part_number: null,
            inventory_status: null,
            quantity:
              result.getValue({
                name: "formulanumeric",
                formula: "{quantity} - {quantityshiprecv}",
                label: "Remaining QTY to be fulfilled",
              }) || null,
            weight: result.getValue("custcol_sal_total_net_weight") ,
            width: width || null,
            length: length || null,
          });
        return true;
      });
      orderInfo.delete_orders = options.deleteOrders;
      return orderInfo;
    } catch (e) {
      log.error("getPendingFulfillmentItem", e.message);
    }
  }

  /**
   * Added weeks to current Date
   * @param date
   * @return {number}
   */
  function addWeekToDate(date) {
    date.setDate(date.getDate() + 7);
    let d = Date.parse(date);
    d = getFormattedDate(new Date(d));
    return d;
  }

  /**
   * Return formatted date M/D/YYYY
   * @param date
   * @return {string} formatted date
   */
  function getFormattedDate(date) {
    let year = date.getFullYear();
    let month = (1 + date.getMonth()).toString();
    let day = date.getDate().toString();

    return month + "/" + day + "/" + year;
  }

  /**
   * Create JSON body and send the request using Headlight integration settings
   * @param {string} options.recId record internal id
   * @param {string} options.headlightSettingId Headlight settings internal id
   * @returns {object} response from Headlight
   */
  function sendOrderDetails(options) {
    log.debug("sendorderDetails", options);
    let recId = options.recId;
    let headlightSettingId = options.headlightSettingId;
    try {
      log.debug("sendOrderDetails", { recId, headlightSettingId });
      const orderObj = getOrderDetails({
        recId: recId,
        recType: options.recType,
      });
      const headlightIntegrationSettings = getHeadlightIntegSettings(
        +headlightSettingId
      );
      return SERP_Headlight_APIService.addOrder({
        recId,
        orderObj,
        headlightIntegrationSettings,
      });
    } catch (e) {
      log.error("sendOrderDetails", e.message);
    }
  }

  /**
   * Load elite Headlight Integration Settings
   * @param headlightId
   */
  function getHeadlightIntegSettings(headlightId) {
    try {
      const headLightSettingsResults = {};
      const headLightSettingsSearch = search.lookupFields({
        type: "customrecord_serp_headlight_integ_sett",
        id: headlightId,
        columns: [
          "custrecord_serp_headlight_ep_url",
          "custrecord_serp_headlight_comp_id",
          "custrecord_serp_headlight_authorization",
          "custrecord_serp_headlight_delete_orders",
        ],
      });
      headLightSettingsResults["endpointURL"] =
        headLightSettingsSearch["custrecord_serp_headlight_ep_url"];
      headLightSettingsResults["authorization"] =
        headLightSettingsSearch["custrecord_serp_headlight_authorization"];
      headLightSettingsResults["companyId"] =
        headLightSettingsSearch["custrecord_serp_headlight_comp_id"];
      headLightSettingsResults["deleteOrders"] =
        headLightSettingsSearch["custrecord_serp_headlight_delete_orders"];
      log.debug("headLightSettingsResults", headLightSettingsResults);
      return headLightSettingsResults;
    } catch (e) {
      log.debug("getHeadlightIntegSettings", e.message);
    }
  }

  /**
   * Update SO successful line item
   * @param orderObj Payload response from Headlight
   * @return {number} return the updated soID
   */
  function updateSuccessfulOrder(orderObj) {
    try {
      log.debug("updateSuccessfulOrder orderobj", orderObj);
      let id = orderObj.remote_primary_key.split("-");

      let orderId = null;
      let soRec = record.load({
        type: record.Type.SALES_ORDER,
        id: id[0],
      });

      let successfullyItemList = orderObj.order_items;
      successfullyItemList.forEach((item) => {
        let uniquekey = item.remote_primary_key.split("-");
        let lineIndex = soRec.findSublistLineWithValue({
          sublistId: "item",
          fieldId: "lineuniquekey",
          value: uniquekey[0],
        });
        soRec.setSublistValue({
          sublistId: "item",
          fieldId: "custcol_serp_headlight_item_id",
          line: lineIndex,
          value: item.id,
        });
        soRec.setSublistValue({
          sublistId: "item",
          fieldId: "custcol_serp_headlight_failed_reason",
          line: lineIndex,
          value: "",
        });

        soRec.setSublistValue({
          sublistId: "item",
          fieldId: "custcol_serp_headlight_res_status",
          line: lineIndex,
          value: "SUCCESS",
        });
        if (orderId == null) orderId = item.order_id;
      });
      soRec.setValue({
        fieldId: "custbody_serp_headlight_deleted_order",
        value: "",
      });
      soRec.setValue({
        fieldId: "custbody_serp_headlight_order_id",
        value: orderObj.id,
      });
      return soRec.save({
        ignoreMandatoryFields: true,
      });
    } catch (e) {
      if (e.message.includes("Record has been changed") == true) {
        updateSuccessfulOrder(orderObj);
      } else {
        log.error("updateSuccessfulOrder", e.message);
      }
    }
  }

  /**
   *Update SO failed line item
   *@param {object} orderObj Failed Order Payload From Headlight
   *@return {number} SoId return internal So Id of
   */
  function updateSoFailedItem(orderObj) {
    try {
      log.debug("failed", orderObj);
      let id = orderObj.data.remote_order_header_id;
      id = id.split("-");

      let soRec = record.load({
        type: record.Type.SALES_ORDER,
        id: id[0],
      });
      let uniquekey = orderObj.data.remote_order_item_id.split("-");
      let lineIndex = soRec.findSublistLineWithValue({
        sublistId: "item",
        fieldId: "lineuniquekey",
        value: uniquekey[0],
      });
      soRec.setSublistValue({
        sublistId: "item",
        fieldId: "custcol_serp_headlight_item_id",
        line: lineIndex,
        value: "",
      });
      soRec.setSublistValue({
        sublistId: "item",
        fieldId: "custcol_serp_headlight_res_status",
        line: lineIndex,
        value: "FAILED",
      });
      soRec.setSublistValue({
        sublistId: "item",
        fieldId: "custcol_serp_headlight_failed_reason",
        line: lineIndex,
        value: orderObj.errors,
      });

      return soRec.save({
        ignoreMandatoryFields: true,
      });
    } catch (e) {
      if (e.message.includes("Record has been changed") == true) {
        updateSoFailedItem(orderObj);
      } else {
        log.error("updateSoFailedItem", e.message);
      }
    }
  }

  /**
   * Update whole SO line item
   *@param {string} options.recId  Sales Order Id
   *@param {object} options.resBody Response from Headlight API
   *@return {number} soId return SO Id
   */
  function updateDeletedOrder(options) {
    try {
      let res = options.resBody;
      let soRec = record.load({
        type: record.Type.SALES_ORDER,
        id: options.recId,
      });
      soRec.setValue({
        fieldId: "custbody_serp_headlight_deleted_order",
        value: res.deleted_orders[0].order_number,
      });
      // soRec.setValue({
      //     fieldId: "custbody_serp_headlight_order_id",
      //     value: ""
      // })
      // for (let i = 0; i < soRec.getLineCount("item"); i++) {
      //     soRec.setSublistValue({
      //         sublistId: "item",
      //         fieldId: "custcol_serp_headlight_item_id",
      //         line: i,
      //         value: ""
      //     })
      //     soRec.setSublistValue({
      //         sublistId: "item",
      //         fieldId: "custcol_serp_headlight_res_status",
      //         line: i,
      //         value: "DELETED"
      //     })
      //     soRec.setSublistValue({
      //         sublistId: "item",
      //         fieldId: "custcol_serp_headlight_failed_reason",
      //         line: i,
      //         value: ""
      //     })
      // }
      return soRec.save({ ignoreMandatoryFields: true });
    } catch (e) {
      log.error("updateDeletedOrder", e.message);
    }
  }

  /**
   * Check if empty string is passed
   * @param {*} stValue
   */
  function isEmpty(stValue) {
    return (
      stValue === "" ||
      stValue == null ||
      false ||
      (stValue.constructor === Array && stValue.length === 0) ||
      (stValue.constructor === Object &&
        (function (v) {
          for (let k in v) return false;
          return true;
        })(stValue))
    );
  }

  /**
   * Group by Order Number
   * @param array
   * @return {[]} array of group orders
   */
  function groupByOrderNumber(array) {
    try {
      return Object.values(
        array.reduce((acc, current) => {
          acc[current.order_number] = acc[current.order_number] ?? [];
          acc[current.order_number].push(current);
          return acc;
        }, {})
      );
    } catch (e) {
      log.error("groupByOrderNumber", e.message);
    }
  }

  return {
    sendOrderDetails: sendOrderDetails,
    getHeadlightIntegSettings: getHeadlightIntegSettings,
    updateSuccessfulOrder: updateSuccessfulOrder,
    updateSoFailedItem: updateSoFailedItem,
    updateDeletedOrder: updateDeletedOrder,
    getPendingFulfillmentItem: getPendingFulfillmentItem,
    groupByOrderNumber: groupByOrderNumber,
  };
});
