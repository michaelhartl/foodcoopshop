/**
 * FoodCoopShop - The open source software for your foodcoop
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @since         FoodCoopShop 1.0.0
 * @license       http://www.opensource.org/licenses/mit-license.php MIT License
 * @author        Mario Rothauer <office@foodcoopshop.com>
 * @copyright     Copyright (c) Mario Rothauer, http://www.rothauer-it.com
 * @link          https://www.foodcoopshop.com
 */
foodcoopshop.Admin = {

    init: function () {
        this.initFilter();
        this.improveTableLayout();
        foodcoopshop.Helper.initJqueryUiIcons();
        this.addPrintAndHelpIcon();
        foodcoopshop.Helper.showContent();
        foodcoopshop.Helper.initMenu();
        foodcoopshop.Helper.initLogoutButton();
        this.setMenuFixed();
        this.adaptContentMargin();
        foodcoopshop.Helper.initScrolltopButton();
    },

    disableSelectpickerItems : function (selector, ids) {
        $(selector).find('option').each(function () {
            var currentId = parseInt($(this).val());
            if ($.inArray(currentId, ids) !== -1) {
                $(this).attr('disabled', 'disabled');
            }
        });
        $(selector).selectpicker('render');
    },

    addLoaderToSyncProductDataButton : function (button) {
        button.on('click', function () {
            foodcoopshop.Helper.addSpinnerToButton($(this), 'fa-arrow-circle-left');
            foodcoopshop.Helper.disableButton($(this));
        });
    },

    selectMainMenuAdmin: function (mainMenuTitle, subMenuTitle) {
        foodcoopshop.Helper.selectMainMenu('#menu', mainMenuTitle, subMenuTitle);
    },

    /**
     * @return rowMarker dom element
     */
    initRowMarkerAll : function () {
        var rowMarkerAll = $('input#row-marker-all').on('change', function () {
            if (this.checked) {
                $('input.row-marker[type="checkbox"]:not(:checked)').trigger('click');
            } else {
                $('input.row-marker[type="checkbox"]:checked').trigger('click');
            }
        });
        return rowMarkerAll;
    },

    initCancelSelectionButton : function () {

        var button = $('#cancelSelectedProductsButton');
        foodcoopshop.Helper.disableButton(button);

        $('table.list').find('input.row-marker[type="checkbox"]').on('click', function () {
            foodcoopshop.Admin.updateCancelSelectionButton(button);
        });

        button.on('click', function () {
            var orderDetailIds = [];
            $('table.list').find('input.row-marker[type="checkbox"]:checked').each(function () {
                var orderDetailId = $(this).closest('tr').find('td:nth-child(2)').html();
                orderDetailIds.push(orderDetailId);
            });
            foodcoopshop.Admin.openBulkDeleteOrderDetailDialog(orderDetailIds);
        });

    },

    updateCancelSelectionButton : function (button) {

        foodcoopshop.Helper.disableButton(button);
        if ($('table.list').find('input.row-marker[type="checkbox"]:checked').length > 0) {
            foodcoopshop.Helper.enableButton(button);
        }

    },

    initChangeOrderStateFromOrderDetails: function () {

        $('body.order_details.index .change-order-state-button').on('click', function () {

            var orderIds = [];
            $('table.list td.orderId').each(function () {
                orderIds.push($(this).html());
            });

            var customerName = $('table.list tr:nth-child(3) td:nth-child(9)').html();
            var buttons = foodcoopshop.Admin.getOrderStateButtons(
                $.unique(orderIds),
                false,
                null,
                customerName
            );

        });
    },

    initFilter: function (callback) {

        var filterContainer = $('.filter-container');

        filterContainer.find('input:text').keyup(function (e) {
            if (e.keyCode == 13) {
                foodcoopshop.Admin.submitFilterForm();
            }
        });

        filterContainer.find('input:text, input:checkbox, select:not(.do-not-submit)').on('change', function () {
            foodcoopshop.Admin.triggerFilter();
        });
        
        filterContainer.find('select').each(function () {
            var options = {
                liveSearch: true,
                showIcon: true
            };
            if ($(this).attr('multiple') == 'multiple') {
                var emptyElement = $(this).find('option').first();
                if (emptyElement.val() == '') {
                    options.noneSelectedText = emptyElement.html();
                    emptyElement.remove();
                }
            }
            $(this).selectpicker(options);
        });
        
        this.setSelectPickerMultipleDropdowns('.filter-container select[multiple="multiple"]');
    },

    /**
     * multiple dropdowns (implemented for orderState) need to be selected manually
     * therefore data-val must be set!
     */
    setSelectPickerMultipleDropdowns : function (selector) {
        $(selector).each(function () {
            var val = $(this).data('val');
            if (val) {
                $(this).selectpicker('val', val.toString().split(','));
            }
        });
    },

    submitFilterForm: function () {
        $('.filter-container form').submit();
    },

    improveTableLayout: function () {

        // copy first row with sums
        var table = $('table.list');
        if (!table.hasClass('no-clone-last-row')) {
            var lastRow = table.find('tr:last-child').clone();
            table.find('tr:first-child').after(lastRow);
        }
        table.show();

        // change color of row on click of checkbox
        table.find('input.row-marker[type="checkbox"]').on('click', function () {
            if ($(this).parent().parent().hasClass('selected')) {
                $(this).parent().parent().removeClass('selected');
            } else {
                $(this).parent().parent().addClass('selected');
            }
        });

    },

    createCustomerCommentEditDialog: function (container) {

        var dialogId = 'customer-comment-edit-form';
        var dialogHtml = foodcoopshop.Dialog.getHtmlForCustomerCommentEdit(dialogId);
        $(container).append(dialogHtml);

        var dialog = $('#' + dialogId).dialog({

            autoOpen: false,
            height: 460,
            width: 350,
            modal: true,

            close: function () {
                $('#cke_dialogCustomerComment').val('');
                $('#dialogCustomerId').val('');
            },

            buttons: {

                'Abbrechen': function () {
                    dialog.dialog('close');
                },

                'Speichern': function () {

                    if ($('#dialogCustomerId').val() == '') {
                        return false;
                    }

                    $('#customer-comment-edit-form .ajax-loader').show();
                    $('.ui-dialog button').attr('disabled', 'disabled');

                    foodcoopshop.Helper.ajaxCall(
                        '/admin/customers/editComment/',
                        {
                            customerId: $('#dialogCustomerId').val(),
                            customerComment: CKEDITOR.instances['dialogCustomerComment'].getData()
                        },
                        {
                            onOk: function (data) {
                                document.location.reload();
                            },
                            onError: function (data) {
                                console.log(data);
                            }
                        }
                    );

                }

            }
        });

        return dialog;

    },

    initCustomerCommentEditDialog: function (container) {

        $('.customer-comment-edit-button').on('click', function () {

            foodcoopshop.Helper.destroyCkeditor('dialogCustomerComment');
            $('#customer-comment-edit-form').remove();

            var dialog = foodcoopshop.Admin.createCustomerCommentEditDialog(container);
            foodcoopshop.Helper.initCkeditor('dialogCustomerComment');

            var text = $(this).attr('title');
            if (text == 'Kommentar hinzufügen') {
                text = '';
            }
            CKEDITOR.instances['dialogCustomerComment'].setData(text); // attr title is deleted after toolbar init
            $('#customer-comment-edit-form #dialogCustomerId').val($(this).closest('tr').find('td:nth-child(1)').html());
            dialog.dialog('open');
        });

    },

    createOrderCommentEditDialog: function (container) {

        var dialogId = 'order-comment-edit-form';
        var dialogHtml = foodcoopshop.Dialog.getHtmlForOrderCommentEdit(dialogId);
        $(container).append(dialogHtml);

        var dialog = $('#' + dialogId).dialog({

            autoOpen: false,
            height: 460,
            width: 350,
            modal: true,

            close: function () {
                $('#cke_dialogOrderComment').val('');
                $('#dialogOrderId').val('');
            },

            buttons: {

                'Abbrechen': function () {
                    dialog.dialog('close');
                },

                'Speichern': function () {

                    $('#order-comment-edit-form .ajax-loader').show();
                    $('.ui-dialog button').attr('disabled', 'disabled');

                    foodcoopshop.Helper.ajaxCall(
                        '/admin/orders/editComment/',
                        {
                            orderId: $('#dialogOrderId').val(),
                            orderComment: CKEDITOR.instances['dialogOrderComment'].getData()
                        },
                        {
                            onOk: function (data) {
                                document.location.reload();
                            },
                            onError: function (data) {
                                console.log(data);
                            }
                        }
                    );

                }

            }
        });

        return dialog;
    },

    initOrderCommentEditDialog: function (container) {

        $('.order-comment-edit-button').on('click', function () {

            foodcoopshop.Helper.destroyCkeditor('dialogOrderComment');
            $('#order-comment-edit-form').remove();

            var dialog = foodcoopshop.Admin.createOrderCommentEditDialog(container);
            foodcoopshop.Helper.initCkeditor('dialogOrderComment');

            var text = $(this).attr('title');
            if (text == 'Kommentar hinzufügen') {
                text = '';
            }
            CKEDITOR.instances['dialogOrderComment'].setData(text);
            $('#order-comment-edit-form #dialogOrderId').val($(this).closest('tr').find('td:nth-child(1)').html());
            dialog.dialog('open');

        });

    },

    initOrderEditDialog: function (container) {

        var dialogId = 'order-edit-form';
        var dialogHtml = foodcoopshop.Dialog.getHtmlForOrderEdit(dialogId);
        $(container).append(dialogHtml);

        var dialog = $('#' + dialogId).dialog({

            autoOpen: false,
            height: 280,
            width: 350,
            modal: true,

            close: function () {
                $('#' + dialogId + ' .date-dropdown-placeholder').html('');
                $('#orderId').val('');
            },

            buttons: {

                'Abbrechen': function () {
                    dialog.dialog('close');
                },

                'Speichern': function () {

                    var newDate = $('#' + dialogId + ' .date-dropdown-placeholder select').val();

                    if (newDate == '' || $('#orderId').val() == '') {
                        return false;
                    }

                    $('#order-edit-form .ajax-loader').show();
                    $('.ui-dialog button').attr('disabled', 'disabled');

                    foodcoopshop.Helper.ajaxCall(
                        '/admin/orders/editDate/',
                        {
                            orderId: $('#orderId').val(),
                            date: newDate
                        },
                        {
                            onOk: function (data) {
                                document.location.reload();
                            },
                            onError: function (data) {
                                console.log(data);
                            }
                        }
                    );

                }

            }
        });

        $('.edit-button').on('click', function () {
            $('#' + dialogId + ' .date-dropdown-placeholder').html($(this).parent().parent().parent().parent().find('td.date-icon div.last-n-days-dropdown').html());
            $('#' + dialogId + ' #orderId').val($(this).parent().parent().parent().parent().find('td:nth-child(1)').html());
            dialog.dialog('open');
        });

    },

    initProductDepositEditDialog: function (container) {

        var dialogId = 'product-deposit-edit-form';
        var dialogHtml = foodcoopshop.Dialog.getHtmlForProductDepositEdit(dialogId);
        $(container).append(dialogHtml);

        var dialog = $('#' + dialogId).dialog({

            autoOpen: false,
            height: 200,
            width: 350,
            modal: true,

            close: function () {
                $('#dialogDepositDeposit').val('');
                $('#dialogDepositProductId').val('');
            },

            buttons: {

                'Abbrechen': function () {
                    dialog.dialog('close');
                },

                'Speichern': function () {

                    if ($('#dialogDepositDeposit').val() == '' || $('#dialogDepositProductId').val() == '') {
                        return false;
                    }

                    $('#product-deposit-edit-form .ajax-loader').show();
                    $('.ui-dialog button').attr('disabled', 'disabled');

                    foodcoopshop.Helper.ajaxCall(
                        '/admin/products/editDeposit/',
                        {
                            productId: $('#dialogDepositProductId').val(),
                            deposit: $('#dialogDepositDeposit').val(),
                        },
                        {
                            onOk: function (data) {
                                document.location.reload();
                            },
                            onError: function (data) {
                                dialog.dialog('close');
                                $('#product-deposit-edit-form .ajax-loader').hide();
                                alert(data.msg);
                            }
                        }
                    );

                }

            }
        });

        $('.product-deposit-edit-button').on('click', function () {
            var row = $(this).closest('tr');
            $('#' + dialogId + ' #dialogDepositDeposit').val(row.find('span.deposit-for-dialog').html());
            $('#' + dialogId + ' #dialogDepositProductId').val(row.find('td:nth-child(1)').html());
            var label = foodcoopshop.Admin.getProductNameForDialog(row);
            $('#' + dialogId + ' label[for="dialogDepositDeposit"]').html(label);
            dialog.dialog('open');
        });

    },

    initProductPriceEditDialog: function (container) {

        var dialogId = 'product-price-edit-form';
        var dialogHtml = foodcoopshop.Dialog.getHtmlForProductPriceEdit(dialogId);
        $(container).append(dialogHtml);

        var dialog = $('#' + dialogId).dialog({

            autoOpen: false,
            height: 300,
            width: 450,
            modal: true,

            close: function () {
                $('#dialogPricePrice').val('');
                $('#dialogPriceProductId').val('');
                $('#dialogPricePricePerUnitEnabled').prop('checked', false);
                $('div.price-per-unit-wrapper').addClass('deactivated');
                $('div.price-wrapper').removeClass('deactivated');
                $('#dialogPricePriceInclPerUnit').val('');
                $('#dialogPriceUnitName').val('');
                $('#dialogPriceQuantityInUnits').val('');
            },

            buttons: {

                'Abbrechen': function () {
                    dialog.dialog('close');
                },

                'Speichern': function () {

                    if ($('#dialogPricePrice').val() == '' || $('#dialogPriceProductId').val() == '') {
                        return false;
                    }

                    $('#product-price-edit-form .ajax-loader').show();
                    $('.ui-dialog button').attr('disabled', 'disabled');

                    foodcoopshop.Helper.ajaxCall(
                        '/admin/products/editPrice/',
                        {
                            productId: $('#dialogPriceProductId').val(),
                            price: $('#dialogPricePrice').val(),
                            priceInclPerUnit: $('#dialogPricePriceInclPerUnit').val(),
                            pricePerUnitEnabled: $('#dialogPricePricePerUnitEnabled:checked').length > 0 ? 1 : 0,
                            priceUnitName: $('#dialogPriceUnitName').val(),
                            priceQuantityInUnits : $('#dialogPriceQuantityInUnits').val()
                        },
                        {
                            onOk: function (data) {
                                document.location.reload();
                            },
                            onError: function (data) {
                                dialog.dialog('close');
                                $('#product-price-edit-form .ajax-loader').hide();
                                foodcoopshop.Helper.showErrorMessage(data.msg);
                            }
                        }
                    );

                }

            }
        });
        
        $('#' + dialogId + ' #dialogPricePricePerUnitEnabled').on('change', function() {
            var priceAsUnitWrapper = $('#' + dialogId + ' .price-per-unit-wrapper');
            var priceWrapper = $('#' + dialogId + ' .price-wrapper');
            if (this.checked) {
                priceAsUnitWrapper.removeClass('deactivated');
                priceWrapper.addClass('deactivated');
            } else {
                priceAsUnitWrapper.addClass('deactivated');
                priceWrapper.removeClass('deactivated');
            }
        });        

        $('.product-price-edit-button').on('click', function () {
            
            var row = $(this).closest('tr');
            var productId = row.find('td:nth-child(1)').html();
            
            var unitData = {};
            var unitObject = $('#product-unit-object-' + productId);
            if (unitObject.length > 0) {
                unitData = unitObject.data('product-unit-object');
                if (unitData.price_per_unit_enabled === 1) {
                    var checkbox = $('#' + dialogId + ' #dialogPricePricePerUnitEnabled');
                    checkbox.prop('checked', true);
                    checkbox.trigger('change');
                }
                $('#' + dialogId + ' #dialogPricePriceInclPerUnit').val(foodcoopshop.Helper.formatFloatAsString(unitData.price_incl_per_unit));
                $('#' + dialogId + ' #dialogPriceUnitName').val(unitData.name);
                $('#' + dialogId + ' #dialogPriceQuantityInUnits').val(foodcoopshop.Helper.formatFloatAsString(unitData.quantity_in_units));
            }
            
            $('#' + dialogId + ' #dialogPricePrice').val(row.find('span.price-for-dialog').html());
            $('#' + dialogId + ' #dialogPriceProductId').val(productId);
            var label = foodcoopshop.Admin.getProductNameForDialog(row);
            $('#' + dialogId + ' label[for="dialogPricePrice"]').html(label);
            dialog.dialog('open');
        });

    },
    
    getProductNameForDialog : function(row) {
        var label = row.find('span.name-for-dialog').html();
        // show name of main product
        if (row.hasClass('sub-row')) {
            label = row.prevAll('.main-product').find('span.name-for-dialog').html() + ': ' + label;
        }
        return label;
    },

    createProductNameEditDialog: function (container) {

        var dialogId = 'product-name-edit-form';
        var dialogHtml = foodcoopshop.Dialog.getHtmlForProductNameEdit(dialogId);
        $(container).append(dialogHtml);

        var dialog = $('#' + dialogId).dialog({

            autoOpen: false,
            height: 640,
            width: 795,
            modal: true,

            close: function () {
                $('#dialogName').val('');
                $('#dialogUnity').val('');
                $('#cke_dialogDescriptionShort').val('');
                $('#cke_dialogDescription').val('');
                $('#dialogIsDeclarationOk').prop('checked', false);
                $('#dialogProductId').val('');
            },

            buttons: {

                'Abbrechen': function () {
                    dialog.dialog('close');
                },

                'Speichern': function () {

                    if ($('#dialogName').val() == '' || $('#dialogProductId').val() == '') {
                        return false;
                    }

                    $('#product-name-edit-form .ajax-loader').show();
                    $('.ui-dialog button').attr('disabled', 'disabled');

                    foodcoopshop.Helper.ajaxCall(
                        '/admin/products/editName/',
                        {
                            productId: $('#dialogProductId').val(),
                            name: $('#dialogName').val(),
                            unity: $('#dialogUnity').val(),
                            descriptionShort: CKEDITOR.instances['dialogDescriptionShort'].getData(),
                            description: CKEDITOR.instances['dialogDescription'].getData(),
                            isDeclarationOk: $('#dialogIsDeclarationOk:checked').length > 0 ? 1 : 0
                        },
                        {
                            onOk: function (data) {
                                document.location.reload();
                            },
                            onError: function (data) {
                                dialog.dialog('close');
                                $('#product-name-edit-form .ajax-loader').hide();
                                foodcoopshop.Helper.showErrorMessage(data.msg);
                            }
                        }
                    );

                }

            }
        });

        return dialog;

    },

    decodeEntities : function (encodedString) {
        var textArea = document.createElement('textarea');
        textArea.innerHTML = encodedString;
        return textArea.value;
    },

    initProductNameEditDialog: function (container) {

        $('.product-name-edit-button').on('click', function () {

            var dialogId = 'product-name-edit-form';
            foodcoopshop.Helper.destroyCkeditor('dialogDescription');
            foodcoopshop.Helper.destroyCkeditor('dialogDescriptionShort');
            $('#' + dialogId).remove();

            var dialog = foodcoopshop.Admin.createProductNameEditDialog(container);

            foodcoopshop.Helper.initCkeditor('dialogDescriptionShort');
            var row = $(this).closest('tr');
            var nameCell = row.find('td:nth-child(4)');
            $('#' + dialogId + ' #dialogName').val(foodcoopshop.Admin.decodeEntities(nameCell.find('span.name-for-dialog').html()));
            $('#' + dialogId + ' #dialogIsDeclarationOk').prop('checked', row.find('span.is-declaration-ok-wrapper').data('is-declaration-ok'));
            var unityElement = nameCell.find('span.unity-for-dialog');
            var unity = '';
            if (unityElement.length > 0) {
                unity = foodcoopshop.Admin.decodeEntities(unityElement.html());
            }
            $('#' + dialogId + ' #dialogUnity').val(unity);
            CKEDITOR.instances['dialogDescriptionShort'].setData(nameCell.find('span.description-short-for-dialog').html());
            $('#' + dialogId + ' #dialogProductId').val(row.find('td:nth-child(1)').html());

            var manufacturerId = row.data('manufacturerId');
            foodcoopshop.Helper.ajaxCall(
                '/admin/manufacturers/setKcFinderUploadPath/' + manufacturerId,
                {},
                {
                    onOk: function (data) {
                        foodcoopshop.Helper.initCkeditorSmallWithUpload('dialogDescription');
                        CKEDITOR.instances['dialogDescription'].setData(nameCell.find('span.description-for-dialog').html());
                    },
                    onError: function (data) {
                        foodcoopshop.Helper.showErrorMessage(data.msg);
                    }
                }
            );

            // hide unity field if product has attributes
            var unitySelector = $('#' + dialogId + ' #labelUnity, #' + dialogId + ' #dialogUnity');
            if ($(this).parent().parent().parent().parent().next().hasClass('sub-row')) {
                unitySelector.hide();
            } else {
                unitySelector.show();
            }

            dialog.dialog('open');

        });

    },

    initHighlightedRowId: function (rowId) {
        $.scrollTo(rowId, 1000, {
            offset: {
                top: -100
            }
        });
        $(rowId).css('background', 'orange');
        $(rowId).css('color', 'white');
        $(rowId).one('mouseover', function () {
            $(this).removeAttr('style');
        });
    },

    initProductQuantityEditDialog: function (container) {

        var dialogId = 'product-quantity-edit-form';
        var dialogHtml = foodcoopshop.Dialog.getHtmlForProductQuantityEdit(dialogId);
        $(container).append(dialogHtml);

        var dialog = $('#' + dialogId).dialog({

            autoOpen: false,
            height: 200,
            width: 350,
            modal: true,

            close: function () {
                $('#dialogQuantityQuantity').val('');
                $('#dialogQuantityProductId').val('');
            },

            buttons: {

                'Abbrechen': function () {
                    dialog.dialog('close');
                },

                'Speichern': function () {

                    if ($('#dialogQuantityQuantity').val() == '' || $('#dialogQuantityProductId').val() == '') {
                        return false;
                    }

                    $('#product-quantity-edit-form .ajax-loader').show();
                    $('.ui-dialog button').attr('disabled', 'disabled');

                    foodcoopshop.Helper.ajaxCall(
                        '/admin/products/editQuantity/',
                        {
                            productId: $('#dialogQuantityProductId').val(),
                            quantity: $('#dialogQuantityQuantity').val(),
                        },
                        {
                            onOk: function (data) {
                                document.location.reload();
                            },
                            onError: function (data) {
                                dialog.dialog('close');
                                $('#product-quantity-edit-form .ajax-loader').hide();
                                foodcoopshop.Helper.showErrorMessage(data.msg);
                            }
                        }
                    );

                }

            }
        });

        $('.product-quantity-edit-button').on('click', function () {
            var row = $(this).closest('tr');
            $('#' + dialogId + ' #dialogQuantityQuantity').val(row.find('span.quantity-for-dialog').html().replace(/\./, ''));
            $('#' + dialogId + ' #dialogQuantityProductId').val(row.find('td:nth-child(1)').html());
            var label = foodcoopshop.Admin.getProductNameForDialog(row);
            $('#' + dialogId + ' label[for="dialogQuantityQuantity"]').html(label);
            dialog.dialog('open');
        });

    },

    initChangeOrderStateFromOrders: function () {
        $('body.orders.index .change-order-state-button').on('click', function () {
            var dataRow = $(this).parent().parent().parent().parent();
            var buttons = foodcoopshop.Admin.getOrderStateButtons(
                [dataRow.find('td:nth-child(1)').html()],
                true,
                dataRow.find('td:nth-child(5)').html(),
                //totalSum
                dataRow.find('td:nth-child(2) span.customer-name').html()
            );
        });
    },

    getOrderStateButtons: function (orderIds, showCancelOrderButton, totalSum, customerName) {

        var buttons = {};

        if ($.inArray('cash', foodcoopshop.Helper.paymentMethods) != -1 &&
            foodcoopshop.Admin.visibleOrderStates.hasOwnProperty('2')) {
            buttons['cash'] = {
                text: foodcoopshop.Admin.visibleOrderStates[2],
                class: 'left-button',
                click: function () {
                    $('.ui-dialog .ajax-loader').show();
                    $('.ui-dialog button').attr('disabled', 'disabled');

                    foodcoopshop.Helper.ajaxCall(
                        '/admin/orders/changeOrderState/',
                        {
                            orderIds: orderIds,
                            orderState: 2
                        },
                        {
                            onOk: function (data) {
                                document.location.href = data.redirectUrl;
                            },
                            onError: function (data) {
                                document.location.reload();
                            }
                        }
                    );
                }
            };
        }

        if ($.inArray('cashless', foodcoopshop.Helper.paymentMethods) != -1 &&
            foodcoopshop.Admin.visibleOrderStates.hasOwnProperty('1')) {
            buttons['cashless'] = {
                text: foodcoopshop.Admin.visibleOrderStates[1],
                class: 'left-button',
                click: function () {
                    $('.ui-dialog .ajax-loader').show();
                    $('.ui-dialog button').attr('disabled', 'disabled');

                    foodcoopshop.Helper.ajaxCall(
                        '/admin/orders/changeOrderState/',
                        {
                            orderIds: orderIds,
                            orderState: 1
                        },
                        {
                            onOk: function (data) {
                                document.location.href = data.redirectUrl;
                            },
                            onError: function (data) {
                                document.location.reload();
                            }
                        }
                    );
                }
            };
        }

        buttons['abbrechen'] = function () {
            $(this).dialog('close');
        };

        if (showCancelOrderButton) {
            buttons['storniert'] = function () {

                $('.ui-dialog .ajax-loader').show();
                $('.ui-dialog button').attr('disabled', 'disabled');

                if (totalSum != '0,00&nbsp;€') {
                    $('.ui-dialog .ajax-loader').hide();
                    alert('Bevor du die Bestellung stornieren kannst, storniere bitte alle bestellten Produkte.');
                    $('.ui-dialog button').attr('disabled', false);
                    return;
                }

                foodcoopshop.Helper.ajaxCall(
                    '/admin/orders/changeOrderState/',
                    {
                        orderIds: orderIds,
                        orderState: 6
                    },
                    {
                        onOk: function (data) {
                            document.location.href = data.redirectUrl;
                        },
                        onError: function (data) {
                            document.location.reload();
                        }
                    }
                );

            };
        }

        buttons['offen'] = function () {

            $('.ui-dialog .ajax-loader').show();
            $('.ui-dialog button').attr('disabled', 'disabled');

            foodcoopshop.Helper.ajaxCall(
                '/admin/orders/changeOrderState/',
                {
                    orderIds: orderIds,
                    orderState: 3
                },
                {
                    onOk: function (data) {
                        document.location.href = data.redirectUrl;
                    },
                    onError: function (data) {
                        document.location.reload();
                    }
                }
            );

        };

        $('<div></div>').appendTo('body')
            .html(foodcoopshop.Admin.additionalOrderStatusChangeInfo + '<p>Willst du den Bestellstatus der Bestellung von <b>' + customerName + '</b> wirklich ändern?</p><img class="ajax-loader" src="/img/ajax-loader.gif" height="32" width="32" />')
            .dialog({
                modal: true,
                title: 'Bestellstatus ändern?',
                autoOpen: true,
                width: 620,
                resizable: false,
                buttons: buttons,
                close: function (event, ui) {
                    $(this).remove();
                }
            });

    },

    openBulkDeleteOrderDetailDialog : function (orderDetailIds) {

        var productString = orderDetailIds.length == 1 ? 'Produkt' : 'Produkte';
        var infoText = '<p>Du hast <b>' + orderDetailIds.length + '</b> ' + productString + ' zum Stornieren ausgewählt:</p>';

        infoText += '<ul>';
        for (var i in orderDetailIds) {
            var dataRow = $('#delete-order-detail-' + orderDetailIds[i]).parent().parent().parent().parent();
            infoText += '<li>- ' + dataRow.find('td:nth-child(4) a').html() + ' / ' + dataRow.find('td:nth-child(9)').html() + '</li>';
        }
        infoText += '</ul>';

        var dialogTitle = 'Ausgewählte Produkte wirklich stornieren?';
        var textareaLabel = 'Warum werden die Produkte storniert (Pflichtfeld)?';
        foodcoopshop.Admin.openDeleteOrderDetailDialog(orderDetailIds, infoText, textareaLabel, dialogTitle);
    },

    openDeleteOrderDetailDialog : function (orderDetailIds, infoText, textareaLabel, dialogTitle) {

        $('#cke_dialogCancellationReason').val('');

        var dialogHtml = infoText;
        if (!foodcoopshop.Helper.isManufacturer) {
            dialogHtml += '<p class="overlay-info">Bitte nur stornieren, wenn es mit dem Hersteller abgesprochen ist!</p>';
        }

        dialogHtml += '<div class="textarea-wrapper">';
        dialogHtml += '<label for="dialogCancellationReason">' + textareaLabel +'</label>';
        dialogHtml += '<textarea class="ckeditor" name="dialogCancellationReason" id="dialogCancellationReason" />';
        dialogHtml += '</div>';
        dialogHtml += '<img class="ajax-loader" src="/img/ajax-loader.gif" height="32" width="32" />';

        $('<div></div>').appendTo('body')
            .html(dialogHtml)
            .dialog({
                modal: true,
                title: dialogTitle,
                autoOpen: true,
                width: 400,
                open: function () {
                    foodcoopshop.Helper.initCkeditor('dialogCancellationReason');
                },
                resizable: false,
                buttons: {
                    'Abbrechen': function () {
                        $(this).dialog('close');
                    },
                    'Ja, stornieren!': function () {

                        var ckeditorData = CKEDITOR.instances['dialogCancellationReason'].getData().trim();
                        if (ckeditorData == '') {
                            alert('Bitte an, warum du das Produkt stornierst.');
                            return;
                        }

                        $('.ui-dialog .ajax-loader').show();
                        $('.ui-dialog button').attr('disabled', 'disabled');
                        foodcoopshop.Helper.ajaxCall(
                            '/admin/order-details/delete',
                            {
                                orderDetailIds: orderDetailIds,
                                cancellationReason: ckeditorData
                            },
                            {
                                onOk: function (data) {
                                    document.location.reload();
                                },
                                onError: function (data) {
                                    document.location.reload();
                                }
                            }
                        );
                    }
                },
                close: function (event, ui) {
                    foodcoopshop.Helper.destroyCkeditor('dialogCancellationReason');
                }
            });
    },

    initDeleteOrderDetail: function () {

        $('.delete-order-detail').on('click', function () {

            var orderDetailId = $(this).attr('id').split('-');
            orderDetailId = orderDetailId[orderDetailId.length - 1];

            var dataRow = $('#delete-order-detail-' + orderDetailId).parent().parent().parent().parent();
            var infoText = '<p>Möchtest du das Produkt <b>' + dataRow.find('td:nth-child(4) a').html() + '</b>';

            if (!foodcoopshop.Helper.isManufacturer) {
                infoText += ' vom Hersteller <b>' + dataRow.find('td:nth-child(5) a').html() + '</b>';
            }
            infoText += ' wirklich stornieren?</p>';

            var dialogTitle = 'Bestelltes Produkt wirklich stornieren?';
            var textareaLabel = 'Warum wird das Produkt storniert (Pflichtfeld)?';

            foodcoopshop.Admin.openDeleteOrderDetailDialog([orderDetailId], infoText, textareaLabel, dialogTitle);

        });
    },

    initChangeNewState: function () {

        $('.change-new-state').on('click', function () {

            var productId = $(this).attr('id').split('-');
            productId = productId[productId.length - 1];

            var newState = 1;
            var newStateText = 'als "neu" anzeigen';
            if ($(this).hasClass('change-new-state-inactive')) {
                newState = 0;
                newStateText = 'nicht mehr als "neu" anzeigen';
            }

            var dataRow = $('#change-new-state-' + productId).parent().parent().parent().parent();
            $('<div></div>').appendTo('body')
                .html('<p>Möchtest du das Produkt <b>' + dataRow.find('td:nth-child(4) span.name-for-dialog').html() + '</b> wirklich im Shop ' + newStateText + '?</p><img class="ajax-loader" src="/img/ajax-loader.gif" height="32" width="32" />')
                .dialog({
                    modal: true,
                    title: 'Produkt ' + newStateText + '?',
                    autoOpen: true,
                    width: 400,
                    resizable: false,
                    buttons: {
                        'Nein': function () {
                            $(this).dialog('close');
                        },
                        'Ja': function () {
                            $('.ui-dialog .ajax-loader').show();
                            $('.ui-dialog button').attr('disabled', 'disabled');
                            document.location.href = '/admin/products/changeNewStatus/' + productId + '/' + newState;
                        }
                    },
                    close: function (event, ui) {
                        $(this).remove();
                    }
                });
        });
    },

    initDeleteProductAttribute: function (container) {

        $(container).find('.delete-product-attribute-button').on('click', function () {

            var splittedProductId = $(this).parent().parent().parent().parent().parent().attr('id').replace(/product-/, '').split('-');
            var productId = splittedProductId[0];
            var productAttributeId = splittedProductId[1];

            var dataRow = $(this).parent().parent().parent().parent().parent();
            var htmlCode = '<p>Die Variante <b>' + dataRow.find('td:nth-child(4) span.name-for-dialog').html() + '</b> wirklich löschen?</p>';
            htmlCode += '<img class="ajax-loader" src="/img/ajax-loader.gif" height="32" width="32" />';

            $('<div></div>').appendTo('body')
                .html(htmlCode)
                .dialog({
                    modal: true,
                    title: 'Variante löschen',
                    autoOpen: true,
                    width: 450,
                    resizable: false,
                    buttons: {
                        'Abbrechen': function () {
                            $(this).dialog('close');
                        },
                        'Löschen': function () {
                            $('.ui-dialog .ajax-loader').show();
                            $('.ui-dialog button').attr('disabled', 'disabled');
                            document.location.href = '/admin/products/deleteProductAttribute/' + productId + '/' + productAttributeId;
                        }
                    },
                    close: function (event, ui) {
                        $(this).remove();
                    }
                });
        });

    },

    initAddProductAttribute: function (container) {

        $(container).find('.add-product-attribute-button').on('click', function () {

            var productId = $(this).parent().parent().parent().parent().attr('id').replace(/product-/, '').split('-');
            productId = productId[productId.length - 1];

            var dataRow = $(this).parent().parent().parent().parent();
            var htmlCode = '<p>Bitte wähle die neue Variante für das Produkt <b>' + dataRow.find('td:nth-child(4) span.name-for-dialog').html() + '</b> aus.</p>';
            var productAttributesDropdown = $('#productattributeid').clone(true);

            if (productAttributesDropdown.find('option').length == 0) {
                alert('Diese Funktion kann erst verwendet werden, sobald Varianten angelegt sind.');
                return;
            }

            productAttributesDropdown.show();
            productAttributesDropdown.removeClass('hide');
            htmlCode += '<select class="product-attributes-dropdown">' + productAttributesDropdown.html() + '</select>';

            htmlCode += '<img class="ajax-loader" src="/img/ajax-loader.gif" height="32" width="32" />';

            $('<div></div>').appendTo('body')
                .html(htmlCode)
                .dialog({
                    modal: true,
                    title: 'Neue Variante für Produkt erstellen',
                    autoOpen: true,
                    width: 450,
                    resizable: false,
                    buttons: {
                        'Abbrechen': function () {
                            $(this).dialog('close');
                        },
                        'Speichern': function () {
                            $('.ui-dialog .ajax-loader').show();
                            $('.ui-dialog button').attr('disabled', 'disabled');
                            document.location.href = '/admin/products/addProductAttribute/' + productId + '/' + $('.product-attributes-dropdown').val();
                        }
                    },
                    close: function (event, ui) {
                        $(this).remove();
                    }
                });
        });

    },

    initSetDefaultAttribute: function (container) {
        $(container).find('.set-as-default-attribute-button').on('click', function () {

            var row = $(this).closest('tr');

            var productIdString = row.attr('id').replace(/product-/, '').split('-');
            var productId = productIdString[0];
            var attributeId = productIdString[1];
            
            var label = foodcoopshop.Admin.getProductNameForDialog(row);
            var htmlCode = '<p>Die Standard-Variante ist die Variante, die beim Bestellen vorausgewählt ist.</p>';
            htmlCode += '<p>Neue Standard-Variante wirklich auf <b>' + label + '</b> ändern?</p>';
            htmlCode += '<img class="ajax-loader" src="/img/ajax-loader.gif" height="32" width="32" />';

            $('<div></div>').appendTo('body')
                .html(htmlCode)
                .dialog({
                    modal: true,
                    title: 'Standard-Variante ändern',
                    autoOpen: true,
                    width: 450,
                    resizable: false,
                    buttons: {
                        'Abbrechen': function () {
                            $(this).dialog('close');
                        },
                        'Speichern': function () {
                            $('.ui-dialog .ajax-loader').show();
                            $('.ui-dialog button').attr('disabled', 'disabled');
                            document.location.href = '/admin/products/changeDefaultAttributeId/' + productId + '/' + attributeId;
                        }
                    },
                    close: function (event, ui) {
                        $(this).remove();
                    }
                });

        });
    },

    initAddProduct: function (container) {

        $(container).find('#add-product-button-wrapper a').on('click', function () {

            $('<div></div>').appendTo('body')
                .html('<p>Möchtest du wirklich ein neues Produkt erstellen?</p><img class="ajax-loader" src="/img/ajax-loader.gif" height="32" width="32" />')
                .dialog({
                    modal: true,
                    title: 'Neues Produkt erstellen',
                    autoOpen: true,
                    width: 400,
                    resizable: false,
                    buttons: {
                        'Nein': function () {
                            $(this).dialog('close');
                        },
                        'Ja': function () {
                            $('.ui-dialog .ajax-loader').show();
                            $('.ui-dialog button').attr('disabled', 'disabled');
                            document.location.href = '/admin/products/add/' + $(container).find('#manufacturerid').val();
                        }
                    },
                    close: function (event, ui) {
                        $(this).remove();
                    }
                });
        });

    },

    initManualOrderListSend: function (container, weekday) {

        $(container).on('click', function () {
            if ($.inArray(foodcoopshop.Helper.cakeServerName, ['http://www.foodcoopshop.test', 'https://demo.foodcoopshop.com']) == -1 &&
                $.inArray(weekday, foodcoopshop.Admin.weekdaysBetweenOrderSendAndDelivery) == -1) {
                alert('Diese Funktion steht heute nicht zur Verfügung.');
                return;
            }

            var manufacturerId = $(this).parent().parent().parent().parent().attr('id').replace(/manufacturer-/, '');
            var dataRow = $('#manufacturer-' + manufacturerId);

            $('<div></div>').appendTo('body')
                .html('<p>Willst du wirklich eine aktuelle Bestellliste an <b>' + dataRow.find('td:nth-child(3) b').html() + '</b> versenden?</p><p>Bestellzeitraum: <b>' + $('#dateFrom').val() + ' bis ' + $('#dateTo').val() + ' </b></p><p>Eine bereits bestehende Bestellliste wird überschrieben!</p><img class="ajax-loader" src="/img/ajax-loader.gif" height="32" width="32" />')
                .dialog({
                    modal: true,
                    title: 'Bestellliste manuell versenden?',
                    autoOpen: true,
                    width: 400,
                    resizable: false,
                    buttons: {
                        'Nein': function () {
                            $(this).dialog('close');
                        },
                        'Ja': function () {
                            $('.ui-dialog .ajax-loader').show();
                            $('.ui-dialog button').attr('disabled', 'disabled');
                            var url = '/admin/manufacturers/sendOrderList/' + manufacturerId + '/' + $('#dateFrom').val() + '/' + $('#dateTo').val();
                            document.location.href = url;
                        }
                    },
                    close: function (event, ui) {
                        $(this).remove();
                    }
                });
        });

    },

    initEmailToAllButton: function () {
        $('button.email-to-all').on('click', function () {
            var emailColumn = $(this).data('column');
            var emails = [];
            $('table.list tr.data').each(function () {
                emails.push($(this).find('td:nth-child(' + emailColumn + ') span.email').html());
            });
            emails = $.unique(emails);

            $('<div></div>').appendTo('body')
                .html('<p>' + emails.join(',') + '</p>')
                .dialog({
                    modal: true,
                    title: 'E-Mail-Adressen',
                    autoOpen: true,
                    width: 800,
                    resizable: false,
                    buttons: {
                        'OK': function () {
                            $(this).dialog('close');
                        }
                    },
                    close: function (event, ui) {
                        $(this).remove();
                    }
                });

        });
    },

    initForm: function () {

        $('.filter-container .right a.submit').on('click', function () {
            foodcoopshop.Helper.disableButton($(this));
            foodcoopshop.Helper.addSpinnerToButton($(this), 'fa-check');
            $(this).closest('#container').find('form.fcs-form').submit();
        });

        $('.filter-container .right a.cancel').on('click', function () {
            foodcoopshop.Helper.disableButton($(this));
            foodcoopshop.Helper.addSpinnerToButton($(this), 'fa-remove');
            var referer = $('input[name=referer').val();
            if (referer == '') {
                referer = '/';
            }
            document.location.href = referer;
        });

        // copy save and cancel button below form
        var form = $('form.fcs-form');
        form.after('<div class="form-buttons"></div>');
        $('#content .form-buttons').append($('.filter-container .right > a').clone(true)); // true clones events

        // submit form on enter in text fields
        form.find('input[type=text], input[type=number], input[type=password], input[type="tel"]').keypress(function (e) {
            if (e.which == 13) {
                $(this).blur();
                $('.filter-container .right a.submit').trigger('click');
            }
        });

        form.find('select').not('.selectpicker-disabled').selectpicker({
            liveSearch: true,
            showIcon: true
        });

        var afterLabelElement = form.find('label span.after');
        afterLabelElement.each(function () {
            var parentWrapper = $(this).closest('.input');
            var errorWrapper = parentWrapper.find('.error-message');
            if (errorWrapper.length > 0) {
                errorWrapper.before($(this));
            } else {
                $(this).appendTo(parentWrapper);
            }
        });

        var errorWrapper = form.find('.error-message');
        errorWrapper.each(function () {
            if ($(this).prev().hasClass('long')) {
                $(this).addClass('long');
            }
        });

    },

    editTaxFormAfterLoad : function (productId) {
        var productName = $('#product-' + productId + ' span.name-for-dialog').html();
        $('.featherlight-content label').html('Steuersatz ändern: ' + productName);
        var selectedTaxId = $('#tax-id-' + productId).val();
        $('.featherlight-content #taxes-id-tax').val(selectedTaxId);
    },

    initProductTaxEditDialog: function (container) {

        var button = $(container).find('.product-tax-edit-button');

        $(button).on('click', function () {

            var objectId = $(this).data('objectId');
            var formHtml = $('.tax-dropdown-wrapper');

            $.featherlight(
                foodcoopshop.AppFeatherlight.initLightboxForForms(
                    foodcoopshop.Admin.editTaxFormSave,
                    foodcoopshop.Admin.editTaxFormAfterLoad,
                    foodcoopshop.AppFeatherlight.closeAndReloadLightbox,
                    formHtml,
                    objectId
                )
            );
        });

    },

    editTaxFormSave: function (productId) {

        foodcoopshop.Helper.ajaxCall(
            '/admin/products/editTax/',
            {
                productId: productId,
                taxId: $('.featherlight-content #taxes-id-tax').val()
            },
            {
                onOk: function (data) {
                    document.location.reload();
                },
                onError: function (data) {
                    document.location.reload();
                    alert(data.msg);
                }
            }
        );

    },

    editCategoriesFormSave: function (productId) {

        var selectedCategories = [];
        $('.featherlight-content .categories-checkboxes input:checked').each(function () {
            selectedCategories.push($(this).val());
        });

        foodcoopshop.Helper.ajaxCall(
            '/admin/products/editCategories/',
            {
                productId: productId,
                selectedCategories: selectedCategories
            },
            {
                onOk: function (data) {
                    document.location.reload();
                },
                onError: function (data) {
                    document.location.reload();
                    alert(data.msg);
                }
            }
        );

    },

    editCategoriesFormAfterLoad : function (productId) {

        var productName = $('#product-' + productId + ' span.name-for-dialog').html();
        $('.featherlight-content label[for="products-categoryproducts"]').html('Kategorien ändern: ' + productName);

        var selectedCategories = $('#selected-categories-' + productId).val().split(',');
        $('.categories-checkboxes input[type="checkbox"]').each(function () {
            if ($.inArray($(this).val(), selectedCategories) != -1) {
                $(this).prop('checked', true);
            } else {
                $(this).prop('checked', false);
            }
        });
    },

    initProductCategoriesEditDialog: function (container) {

        var button = $(container).find('.product-categories-edit-button');

        $(button).on('click', function () {

            var objectId = $(this).data('objectId');
            var formHtml = $('.categories-checkboxes');

            $.featherlight(
                foodcoopshop.AppFeatherlight.initLightboxForForms(
                    foodcoopshop.Admin.editCategoriesFormSave,
                    foodcoopshop.Admin.editCategoriesFormAfterLoad,
                    foodcoopshop.AppFeatherlight.closeAndReloadLightbox,
                    formHtml,
                    objectId
                )
            );

        });

    },

    triggerFilter : function () {
        $('#filter-loader').remove();
        $('#content').css('opacity', '.4');
        $('#container').append('<i id="filter-loader" class="fa fa-spinner"></i>');
        var marginTop = $('.filter-container').outerHeight();
        $('#filter-loader').css('top', marginTop + 20);
        foodcoopshop.Admin.submitFilterForm();
    },

    initNextAndPreviousDayLinks: function () {
        $('.btn-previous-day').on('click', function () {
            var datepicker = $(this).next();
            var date = datepicker.datepicker('getDate');
            date.setDate(date.getDate() - 1);
            datepicker.datepicker('setDate', date);
            if ($(this).closest('.filter-container').length > 0) {
                foodcoopshop.Admin.triggerFilter();
            }
        });
        $('.btn-next-day').on('click', function () {
            var datepicker = $(this).prev();
            var date = datepicker.datepicker('getDate');
            date.setDate(date.getDate() + 1);
            datepicker.datepicker('setDate', date);
            if ($(this).closest('.filter-container').length > 0) {
                foodcoopshop.Admin.triggerFilter();
            }
        });
    },

    setOrderDetailTimebasedCurrencyData : function(elementToAttach, timebasedCurrencyObject) {
        elementToAttach.data('timebased-currency-object', $.parseJSON(timebasedCurrencyObject));
    },
    
    setProductUnitData : function(elementToAttach, productUnitObject) {
        elementToAttach.data('product-unit-object', $.parseJSON(productUnitObject));
    },

    initOrderDetailProductPriceEditDialog: function (container) {

        $('#cke_dialogPriceEditReason').val('');

        var dialogId = 'order-detail-product-price-edit-form';
        var dialogHtml = foodcoopshop.Dialog.getHtmlForOrderDetailProductPriceEdit(dialogId);
        $(container).append(dialogHtml);

        var dialog = $('#' + dialogId).dialog({

            autoOpen: false,
            width: 400,
            modal: true,
            close: function () {
                $('#dialogOrderDetailProductPricePrice').val('');
                $('#dialogOrderDetailProductPriceOrderDetailId').val('');
                foodcoopshop.Helper.destroyCkeditor('dialogEditPriceReason');
            },
            open: function () {
                foodcoopshop.Helper.initCkeditor('dialogEditPriceReason');
            },
            buttons: {

                'Abbrechen': function () {
                    dialog.dialog('close');
                },

                'Speichern': function () {

                    if ($('#dialogOrderDetailProductPricePrice').val() == '' || $('#dialogOrderDetailProductPriceOrderDetailId').val() == '') {
                        return false;
                    }

                    var ckeditorData = CKEDITOR.instances['dialogEditPriceReason'].getData().trim();
                    if (ckeditorData == '') {
                        alert('Bitte an, warum der Preis geändert wird.');
                        return;
                    }
                    
                    var productPrice = $('#dialogOrderDetailProductPricePrice').val();
                    var timebasedCurrencyPriceObject = $('#dialogOrderDetailProductPriceTimebasedCurrencyPrice');
                    if (timebasedCurrencyPriceObject.length > 0) {
                        productPrice = timebasedCurrencyPriceObject.val();
                    }
                    
                    $('#order-detail-product-price-edit-form .ajax-loader').show();
                    $('.ui-dialog button').attr('disabled', 'disabled');

                    foodcoopshop.Helper.ajaxCall(
                        '/admin/order-details/editProductPrice/',
                        {
                            orderDetailId: $('#dialogOrderDetailProductPriceOrderDetailId').val(),
                            productPrice: productPrice,
                            editPriceReason: ckeditorData
                        },
                        {
                            onOk: function (data) {
                                document.location.reload();
                            },
                            onError: function (data) {
                                dialog.dialog('close');
                                $('#order-detail-product-price-edit-form .ajax-loader').hide();
                                alert(data.msg);
                            }
                        }
                    );

                }

            }
        });

        $('.order-detail-product-price-edit-button').on('click', function () {
        
            var row = $(this).closest('tr');
            var orderDetailId = row.find('td:nth-child(2)').html();
            var price = row.find('td:nth-child(6) span.product-price-for-dialog').html();
            var productPriceField = $('#' + dialogId + ' #dialogOrderDetailProductPricePrice');
            
            $('#' + dialogId + ' #dialogOrderDetailProductPriceOrderDetailId').val(orderDetailId);
            $('#' + dialogId + ' label[for="dialogOrderDetailProductPricePrice"]').html(row.find('td:nth-child(4) a.name-for-dialog').html() + ' <span style="font-weight:normal;">(von ' + row.find('td:nth-child(9)').html() + ')');
            
            $('#' + dialogId + ' span.timebased-currency-wrapper').remove();
            var timebasedCurrencyObject = $('#timebased-currency-object-' + orderDetailId);
            if (timebasedCurrencyObject.length > 0 && $('#' + dialogId + ' #dialogOrderDetailProductPriceTimebasedCurrencyPrice').length == 0) {
                var timebasedCurrencyData = timebasedCurrencyObject.data('timebased-currency-object');
                var additionalDialogHtml = '<span class="timebased-currency-wrapper">';
                additionalDialogHtml += '<span class="small"> (Original-Preis ohne Abzug von Betrag in Zeit)</span>';
                additionalDialogHtml += '<label for="dialogOrderDetailProductPriceTimebasedCurrency"></label><br />';
                additionalDialogHtml += '<input type="text" name="dialogOrderDetailProductPriceTimebasedCurrencyPrice" id="dialogOrderDetailProductPriceTimebasedCurrencyPrice" value="" />';
                additionalDialogHtml += '<b>€</b><span class="small"> (Davon tatsächlich bezahlter Betrag in Euro)</span>';
                additionalDialogHtml += '</span>';
                $('#' + dialogId + ' .textarea-wrapper').before(additionalDialogHtml);
            }
            
            if (timebasedCurrencyObject.length > 0) {
                var newPrice = foodcoopshop.Helper.getStringAsFloat(price) + timebasedCurrencyData.money_incl;
                var productTimebasedCurrencyPriceField = $('#' + dialogId + ' #dialogOrderDetailProductPriceTimebasedCurrencyPrice');
                productPriceField.val(foodcoopshop.Helper.formatFloatAsString(newPrice));
                productTimebasedCurrencyPriceField.val(price);
                foodcoopshop.TimebasedCurrency.bindOrderDetailProductPriceField(productPriceField, timebasedCurrencyData, productTimebasedCurrencyPriceField);
                foodcoopshop.TimebasedCurrency.bindOrderDetailProductTimebasedCurrencyPriceField(productTimebasedCurrencyPriceField, timebasedCurrencyData, productPriceField);
                
            } else {
                productPriceField.val(price);
            }
        
            dialog.dialog('open');
        });

    },

    setVisibleOrderStates: function (visibleOrderStates) {
        this.visibleOrderStates = $.parseJSON(visibleOrderStates);
    },

    setWeekdaysBetweenOrderSendAndDelivery: function (weekdaysBetweenOrderSendAndDelivery) {
        this.weekdaysBetweenOrderSendAndDelivery = $.parseJSON(weekdaysBetweenOrderSendAndDelivery);
    },

    setAdditionalOrderStatusChangeInfo: function (additionalOrderStatusChangeInfo) {
        this.additionalOrderStatusChangeInfo = additionalOrderStatusChangeInfo;
    },

    initOrderDetailProductAmountEditDialog: function (container) {

        $('#cke_dialogEditAmountReason').val('');

        var dialogId = 'order-detail-product-amount-edit-form';
        var dialogHtml = foodcoopshop.Dialog.getHtmlForOrderDetailProductAmountEdit(dialogId);
        $(container).append(dialogHtml);

        var dialog = $('#' + dialogId).dialog({

            autoOpen: false,
            height: 600,
            width: 450,
            modal: true,

            close: function () {
                $('#dialogOrderDetailProductAmountAmount').val('');
                $('#dialogOrderDetailProductAmountOrderDetailId').val('');
                foodcoopshop.Helper.destroyCkeditor('dialogEditAmountReason');
            },
            open: function () {
                foodcoopshop.Helper.initCkeditor('dialogEditAmountReason');
            },

            buttons: {

                'Abbrechen': function () {
                    dialog.dialog('close');
                },

                'Speichern': function () {

                    if ($('#dialogOrderDetailProductAmountAmount').val() == '' || $('#dialogOrderDetailProductAmountOrderDetailId').val() == '') {
                        return false;
                    }

                    var ckeditorData = CKEDITOR.instances['dialogEditAmountReason'].getData().trim();
                    if (ckeditorData == '') {
                        alert('Bitte an, warum die Anzahl geändert wird.');
                        return;
                    }

                    $('#order-detail-product-amount-edit-form .ajax-loader').show();
                    $('.ui-dialog button').attr('disabled', 'disabled');

                    foodcoopshop.Helper.ajaxCall(
                        '/admin/order-details/editProductAmount/',
                        {
                            orderDetailId: $('#dialogOrderDetailProductAmountOrderDetailId').val(),
                            productAmount: $('#dialogOrderDetailProductAmountAmount').val(),
                            editAmountReason: ckeditorData
                        },
                        {
                            onOk: function (data) {
                                document.location.reload();
                            },
                            onError: function (data) {
                                dialog.dialog('close');
                                $('#order-detail-product-amount-edit-form .ajax-loader').hide();
                                alert(data.msg);
                            }
                        }
                    );

                }

            }
        });

        $('.order-detail-product-amount-edit-button').on('click', function () {
            var currentAmount = $(this).closest('tr').find('td:nth-child(3) span.product-amount-for-dialog').html();
            var select = $('#' + dialogId + ' #dialogOrderDetailProductAmountAmount');
            select.find('option').remove();
            for (var i = currentAmount - 1; i >= 1; i--) {
                select.append($('<option>', {
                    value: i,
                    text: i
                }));
            }
            $('#' + dialogId + ' #dialogOrderDetailProductAmountOrderDetailId').val($(this).closest('tr').find('td:nth-child(2)').html());
            $('#' + dialogId + ' label[for="dialogOrderDetailProductAmount"]').html('<span style="font-weight:normal"><br />Die Anzahl kann nur vermindert werden.<br />Um die Anzahl zu erhöhen, bitte das Produkt nachbuchen.<br /><br /></span>' + $(this).closest('tr').find('td:nth-child(4) a.name-for-dialog').html() + ' <span style="font-weight:normal;">(von ' + $(this).closest('tr').find('td:nth-child(9)').html() + ')<br />Neue Anzahl:');
            dialog.dialog('open');
        });

    },

    initCustomerGroupEditDialog: function (container) {

        var dialogId = 'customer-group-edit-form';
        var dialogHtml = foodcoopshop.Dialog.getHtmlForCustomerGroupEdit(dialogId);
        $(container).append(dialogHtml);

        var dialog = $('#' + dialogId).dialog({

            autoOpen: false,
            width: 400,
            modal: true,

            close: function () {
                $('#dialogCustomerGroupEditGroupId').val('');
                $('#dialogCustomerGroupEditCustomerId').val('');
            },

            buttons: {

                'Abbrechen': function () {
                    dialog.dialog('close');
                },

                'Speichern': function () {

                    if ($('#dialogCustomerGroupEditGroupId').val() == '' || $('#dialogCustomerGroupEditCustomerId').val() == '') {
                        return false;
                    }

                    $('#customer-group-edit-form .ajax-loader').show();
                    $('.ui-dialog button').attr('disabled', 'disabled');

                    foodcoopshop.Helper.ajaxCall(
                        '/admin/customers/ajaxEditGroup/',
                        {
                            customerId: $('#dialogCustomerGroupEditCustomerId').val(),
                            groupId: $('#dialogCustomerGroupEditGroup').val(),
                        },
                        {
                            onOk: function (data) {
                                document.location.reload();
                            },
                            onError: function (data) {
                                dialog.dialog('close');
                                $('#customer-group-edit-form .ajax-loader').hide();
                                alert(data.msg);
                            }
                        }
                    );

                }

            }
        });

        $('.customer-group-edit-button').on('click', function () {
            var selectedGroupId = $(this).closest('tr').find('td:nth-child(3) span.group-for-dialog').html();
            var select = $('#' + dialogId + ' #dialogCustomerGroupEditGroup');
            select.find('option').remove();
            select.append($('#selectgroupid').html());
            select.val(selectedGroupId);
            $('#' + dialogId + ' #dialogCustomerGroupEditText').html('Gruppe ändern für ' + $(this).closest('tr').find('td:nth-child(2) a').text() + '<p style="font-weight: normal;"><br />Er/Sie muss sich nach der Änderung neu einloggen.</p>');
            $('#' + dialogId + ' #dialogCustomerGroupEditCustomerId').val($(this).closest('tr').find('td:nth-child(1)').html());
            dialog.dialog('open');
        });

    },

    /**
     * @param string button
     * @param int weekday
     */
    initAddOrder: function (button, weekday) {
        // auf dev und demo seite immer zulassen (zum testen)
        if ($.inArray(foodcoopshop.Helper.cakeServerName, [
            'http://www.foodcoopshop.test',
            'https://demo.foodcoopshop.com'
        ]) == -1 &&
            $.inArray(weekday, foodcoopshop.Admin.weekdaysBetweenOrderSendAndDelivery) == -1) {
            $(button).on('click', function (event) {
                alert('Diese Funktion steht heute nicht zur Verfügung.');
                $.featherlight.close();
            });
        } else {
            $(button).on('click', function () {

                var configuration = foodcoopshop.AppFeatherlight.initLightbox({
                    iframe: foodcoopshop.Helper.cakeServerName + '/admin/orders/iframeStartPage',
                    iframeWidth: $(window).width() - 50,
                    iframeMaxWidth: '100%',
                    iframeHeight: $(window).height() - 100,
                    afterClose: function () {
                        foodcoopshop.Helper.ajaxCall(
                            '/carts/ajaxDeleteShopOrderCustomer',
                            {},
                            {
                                onOk: function (data) {},
                                onError: function (data) {}
                            }
                        );
                    },
                    afterContent: function () {

                        var header = $('<div class="message-container"><span class="start"><b>Sofort-Bestellung </b> tätigen für: </span> Nach dem Abschließen der Bestellung wird sie automatisch rückdatiert.</div>');
                        $('.featherlight-close').after(header);

                        // only clone dropdown once
                        if ($('.message-container span.start select').length == 0) {
                            var customersDropdown = $('#add-order-button-wrapper select').clone(true);
                            customersDropdown.attr(
                                'id',
                                'customersDropdown'
                            );
                            customersDropdown
                                .change(function () {
                                    var newSrc = foodcoopshop.Helper.cakeServerName + '/admin/orders/initShopOrder/' + $(this).val();
                                    $('iframe.featherlight-inner').attr('src', newSrc);
                                    $.featherlight.showLoader();
                                });

                            $('iframe.featherlight-inner')
                                .load(
                                    function () {
                                        // called after each url change in iframe!
                                        $.featherlight.hideLoader();
                                        var currentUrl = $(this).get(0).contentWindow.document.URL;
                                        if (currentUrl.match(/warenkorb\/abgeschlossen/)) {
                                            $.featherlight.showLoader();
                                            document.location.href = '/admin/orders/correctShopOrder?url=' + encodeURIComponent(currentUrl);
                                        }
                                    }
                                );
                            customersDropdown.show();
                            customersDropdown.removeClass('hide');
                            customersDropdown.appendTo('.message-container span.start');

                            // always preselect user if there is a dropdown called #customerId (for call from order detail)
                            var customerId = $('#customerid').val();
                            if (customerId > 0) {
                                customersDropdown.val(customerId);
                                customersDropdown.trigger('change');
                            }
                        }
                    }
                });

                $.featherlight(configuration);

            });
        }
    },

    addPrintAndHelpIcon: function () {

        var html = '<div class="icons">';
        html += '<a class="btn btn-default" title="Drucken" href="javascript:window.print();"><i class="fa fa-print fa-lg"></i></a>';
        html += '<a class="btn btn-default help" title="Hilfe" class="help" href="javascript:void(0);"><i class="fa fa-question fa-lg"></i></a>';
        html += '</div>';

        var container = $('.filter-container').length > 0 ? $('.filter-container') : $('.filter-container-not-fixed');
        container.find('div.right').append(html);

        container.find('div.right a.help').on('click', function () {
            $('#help-container').stop(true).animate({
                height: 'toggle'
            }, 0);
            $.scrollTo('body', 1000, {
                offset: {
                    top: 0
                }
            });
        });

    },

    setMenuFixed: function () {
        $(window).scroll(function () {
            $('#menu').css('left', -$(window).scrollLeft());
            $('.filter-container').css('margin-left', -$(window).scrollLeft());
        });
        $('#menu').show();
    },

    adaptContentMargin: function () {
        var marginTop = $('.filter-container').outerHeight();
        $('#content').css('margin-top', marginTop);
        $('#menu').css('min-height', marginTop + $('#content').height() + 4);
    },

    initCustomerChangeActiveState: function () {

        $('.change-active-state').on('click', function () {

            var customerId = $(this).attr('id').split('-');
            customerId = customerId[customerId.length - 1];

            var newState = 1;
            var newStateText = 'aktivieren';
            if ($(this).hasClass('set-state-to-inactive')) {
                newState = 0;
                newStateText = 'deaktivieren';
            }

            var dataRow = $('#change-active-state-' + customerId).parent().parent().parent().parent();

            var buttons = {};
            buttons['no'] = {
                text: 'Nein',
                click: function () {
                    $(this).dialog('close');
                }
            };

            if (newState == 1) {
                buttons['yes'] = {
                    text: 'Ja (Info-Mail wird versendet)',
                    click: function () {
                        $('.ui-dialog .ajax-loader').show();
                        $('.ui-dialog button').attr(
                            'disabled',
                            'disabled'
                        );
                        document.location.href = '/admin/customers/changeStatus/' + customerId + '/' + newState + '/1';
                    }
                };
            } else {
                buttons['yes'] = {
                    text: 'Ja',
                    click: function () {
                        $('.ui-dialog .ajax-loader').show();
                        $('.ui-dialog button').attr(
                            'disabled',
                            'disabled'
                        );
                        document.location.href = '/admin/customers/changeStatus/' + customerId + '/' + newState + '/0';
                    }
                };
            }

            $('<div></div>')
                .appendTo('body')
                .html(
                    '<p>Möchtest du das Mitglied <b>' +
                    dataRow
                        .find(
                            'td:nth-child(2) span.name a'
                        )
                        .html() +
                    '</b> wirklich ' +
                    newStateText +
                    '?</p><img class="ajax-loader" src="/img/ajax-loader.gif" height="32" width="32" />'
                )
                .dialog({
                    modal: true,
                    title: 'Mitglied ' +
                        newStateText + '?',
                    autoOpen: true,
                    width: 400,
                    resizable: false,
                    buttons: buttons,
                    close: function (event, ui) {
                        $(this).remove();
                    }
                });
        });
    },

    initProductChangeActiveState: function () {

        $('.change-active-state').on('click', function () {

            var productId = $(this).attr('id').split('-');
            productId = productId[productId.length - 1];

            var newState = 1;
            var newStateText = 'aktivieren';
            if ($(this).hasClass('set-state-to-inactive')) {
                newState = 0;
                newStateText = 'deaktivieren';
            }

            var dataRow = $('#change-active-state-' + productId).parent().parent().parent().parent();
            $('<div></div>')
                .appendTo('body')
                .html('<p>Möchtest du das Produkt <b>' +
                    dataRow
                        .find(
                            'td:nth-child(4) span.name-for-dialog'
                        )
                        .html() +
                    '</b> wirklich ' +
                    newStateText +
                    '?</p><img class="ajax-loader" src="/img/ajax-loader.gif" height="32" width="32" />')
                .dialog({
                    modal: true,
                    title: 'Produkt ' +
                        newStateText + '?',
                    autoOpen: true,
                    width: 400,
                    resizable: false,
                    buttons: {
                        'Nein': function () {
                            $(this).dialog('close');
                        },
                        'Ja': function () {
                            $('.ui-dialog .ajax-loader')
                                .show();
                            $('.ui-dialog button')
                                .attr(
                                    'disabled',
                                    'disabled'
                                );
                            document.location.href = '/admin/products/changeStatus/' +
                                productId +
                                '/' +
                                newState;
                        }
                    },
                    close: function (event, ui) {
                        $(this).remove();
                    }
                });
        });
    },

    /**
     * @deprecated
     */
    initCloseOrdersButton: function (container) {

        $('#closeOrdersButton')
            .on(
                'click',
                function () {

                    var orderIdsContainer = $('table.list td.order-id');
                    var orderIds = [];
                    orderIdsContainer.each(function () {
                        orderIds.push($(this).html());
                    });

                    $('<div></div>')
                        .appendTo('body')
                        .html(
                            '<p>Möchtest du wirklich alle angezeigten Bestellungen <b>abschließen</b>?</p><img class="ajax-loader" src="/img/ajax-loader.gif" height="32" width="32" />'
                        )
                        .dialog({
                            modal: true,
                            title: 'Alle Bestellungen abschließen',
                            autoOpen: true,
                            width: 400,
                            resizable: false,
                            buttons: {
                                'Nein': function () {
                                    $(this).dialog('close');
                                },
                                'Ja': function () {

                                    $('.ui-dialog .ajax-loader')
                                        .show();
                                    $('.ui-dialog button')
                                        .attr(
                                            'disabled',
                                            'disabled'
                                        );
                                    var orderState;
                                    if ($
                                        .inArray(
                                            'cash',
                                            foodcoopshop.Helper.paymentMethods
                                        ) != -1) {
                                        orderState = 2;
                                    }
                                    if ($
                                        .inArray(
                                            'cashless',
                                            foodcoopshop.Helper.paymentMethods
                                        ) != -1) {
                                        orderState = 1;
                                    }

                                    foodcoopshop.Helper
                                        .ajaxCall(
                                            '/admin/orders/changeOrderStateToClosed/',
                                            {
                                                orderIds: orderIds,
                                                orderState: orderState
                                            },
                                            {
                                                onOk: function (
                                                    data
                                                ) {
                                                    document.location
                                                        .reload();
                                                },
                                                onError: function (
                                                    data
                                                ) {
                                                    document.location
                                                        .reload();
                                                }
                                            }
                                        );

                                }

                            },
                            close: function (event, ui) {
                                $(this).remove();
                            }
                        });
                }
            );

    },

    initGenerateOrdersAsPdf: function () {

        $('button.generate-orders-as-pdf')
            .on(
                'click',
                function () {

                    var orderIdsContainer = $('table.list td.order-id');
                    var orderIds = [];
                    orderIdsContainer.each(function () {
                        orderIds.push($(this).html());
                    });

                    $('<div></div>')
                        .appendTo('body')
                        .html(
                            '<p>Möchtest du wirklich alle Bestellungen als PDF generieren?</p><img class="ajax-loader" src="/img/ajax-loader.gif" height="32" width="32" />'
                        )
                        .dialog({
                            modal: true,
                            title: 'Bestellungen als PDF generieren',
                            autoOpen: true,
                            width: 400,
                            resizable: false,
                            buttons: {
                                'Nein': function () {
                                    $(this).dialog('close');
                                },
                                'Ja': function () {
                                    $('.ui-dialog .ajax-loader')
                                        .show();
                                    $('.ui-dialog button')
                                        .attr(
                                            'disabled',
                                            'disabled'
                                        );
                                    window.open('/admin/orders/ordersAsPdf.pdf?orderIds=' + orderIds.join(','));
                                    $(this).dialog('close');
                                }

                            },
                            close: function (event, ui) {
                                $(this).remove();
                            }
                        });
                }
            );

    },

    initAddPaymentInList: function (button) {

        $(button).each(function () {

            var buttonClass = button.replace(/\./, '');
            buttonClass = buttonClass.replace(/-button/, '');
            var formHtml = $('#' + buttonClass + '-form-' + $(this).data('objectId'));

            $(this).featherlight(
                foodcoopshop.AppFeatherlight.initLightboxForForms(
                    foodcoopshop.Admin.addPaymentFormSave,
                    null,
                    foodcoopshop.AppFeatherlight.closeLightbox,
                    formHtml
                )
            );

        });

    },

    initAddPayment: function (button) {

        $(button).featherlight(
            foodcoopshop.AppFeatherlight.initLightboxForForms(
                foodcoopshop.Admin.addPaymentFormSave,
                null,
                foodcoopshop.AppFeatherlight.closeLightbox,
                $('.add-payment-form')
            )
        );

    },

    addPaymentFormSave: function () {

        var amount = $('.featherlight-content #payments-amount').val();
        if (isNaN(parseFloat(amount.replace(/,/, '.')))) {
            alert('Bitte gib eine Zahl ein.');
            foodcoopshop.AppFeatherlight.enableSaveButton();
            return;
        }

        var type = $('.featherlight-content input[name="Payments[type]"]').val();
        var customerIdDomElement = $('.featherlight-content input[name="Payments[customerId]"]');
        var manufacturerIdDomElement = $('.featherlight-content input[name="Payments[manufacturerId]"]');

        var text = '';
        if ($('.featherlight-content input[name="Payments[text]"]').length > 0) {
            text = $('.featherlight-content input[name="Payments[text]"]').val().trim();
        }

        // radio buttons only if deposit is added to manufacurers
        if ($('.featherlight-content input[type="radio"]').length > 0) {
            var selectedRadioButton = $('.featherlight-content input[type="radio"]:checked');

            // check if radio buttons are in deposit form or product form
            var message;
            var isDepositForm;
            if ($('.featherlight-content .add-payment-form').hasClass('add-payment-deposit-form')) {
                message = 'Bitte wähle die Art der Pfand-Rücknahme aus.';
                isDepositForm = true;
            } else {
                message = 'Bitte wähle aus, ob es sich um eine Aufladung oder ein Rückzahlung handelt.';
                isDepositForm = false;
            }

            if (selectedRadioButton.length == 0) {
                alert(message);
                foodcoopshop.AppFeatherlight.enableSaveButton();
                return;
            }

            var selectedRadioButtonValue = $('.featherlight-content input[type="radio"]:checked').val();
            if (isDepositForm) {
                text = selectedRadioButtonValue;
            } else {
                type = selectedRadioButtonValue;
            }
        }

        var months_range = [];
        if ($('.featherlight-content input[type="checkbox"]').length > 0) {
            $('.featherlight-content input[type="checkbox"]:checked').each(
                function () {
                    months_range.push($(this).val());
                }
            );
            if (months_range.length == 0) {
                alert('Bitte wähle zumindest ein Monat aus.');
                foodcoopshop.AppFeatherlight.enableSaveButton();
                return;
            }
        }

        foodcoopshop.Helper.ajaxCall('/admin/payments/add/', {
            amount: amount,
            type: type,
            text: text,
            months_range: months_range,
            customerId: customerIdDomElement.length > 0 ? customerIdDomElement.val() : 0,
            manufacturerId: manufacturerIdDomElement.length > 0 ? manufacturerIdDomElement.val() : 0
        }, {
            onOk: function (data) {
                document.location.reload();
            },
            onError: function (data) {
                alert(data.msg);
                document.location.reload();
            }
        });

    },

    initDeletePayment: function () {

        $('.delete-payment-button').on('click',function () {

            var dataRow = $(this).closest('tr');

            var dialogHtml = '<p>Willst du deine Zahlung wirklich löschen?<br />';
            dialogHtml += 'Datum: <b>' + dataRow.find('td:nth-child(2)').html() + '</b> <br />';
            dialogHtml += 'Betrag: <b>' + dataRow.find('td:nth-child(4)').html();
            if (dataRow.find('td:nth-child(6)').length > 0) {
                dialogHtml += dataRow.find('td:nth-child(6)').html();
            }
            dialogHtml += '</b>';
            dialogHtml += '</p><img class="ajax-loader" src="/img/ajax-loader.gif" height="32" width="32" />';

            $('<div></div>')
                .appendTo('body')
                .html(dialogHtml)
                .dialog({
                    modal: true,
                    title: 'Zahlung löschen?',
                    autoOpen: true,
                    width: 400,
                    resizable: false,
                    buttons: {

                        'Abbrechen': function () {
                            $(this).dialog('close');
                        },

                        'Ja': function () {

                            $('.ui-dialog .ajax-loader').show();
                            $('.ui-dialog button').attr('disabled', 'disabled');

                            var paymentId = dataRow.find('td:nth-child(1)').html();

                            foodcoopshop.Helper.ajaxCall(
                                '/admin/payments/changeState/',
                                {
                                    paymentId: paymentId
                                },
                                {
                                    onOk: function (data) {
                                        document.location.reload();
                                    },
                                    onError: function (data) {
                                        alert(data.msg);
                                    }
                                }
                            );

                        }

                    },
                    close: function (event, ui) {
                        $(this).remove();
                    }
                });
        });

    },

    initProductDropdown: function (selectedProductId, manufacturerId) {

        manufacturerId = manufacturerId || 0;
        var productDropdown = $('select#productid').closest('.bootstrap-select').find('.dropdown-toggle');

        // one removes itself after one execution
        productDropdown.one('click', function () {

            $(this).parent().find('span.filter-option').append('<i class="fa fa-spinner fa-spin"></i>');

            foodcoopshop.Helper
                .ajaxCall('/admin/products/ajaxGetProductsForDropdown/' +
                    selectedProductId + '/' + manufacturerId, {}, {
                    onOk: function (data) {
                        var select = $('select#productid');
                        select.append(data.products);
                        select.attr('disabled', false);
                        select.selectpicker('refresh');
                        select.find('i.fa-spinner').remove();
                    },
                    onError: function (data) {
                        console.log(data.msg);
                    }
                });

        });

        if (selectedProductId > 0) {
            // one click for opening and loading the products
            productDropdown.trigger('click');
            // and another click for closing the dropdown
            productDropdown.trigger('click');
        }

    }

};
