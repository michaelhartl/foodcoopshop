<?php
/**
 * FoodCoopShop - The open source software for your foodcoop
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @since         FoodCoopShop 2.1.0
 * @license       http://www.opensource.org/licenses/mit-license.php MIT License
 * @author        Mario Rothauer <office@foodcoopshop.com>
 * @copyright     Copyright (c) Mario Rothauer, http://www.rothauer-it.com
 * @link          https://www.foodcoopshop.com
 */

namespace App\Controller;

use Cake\Controller\Controller;
use Cake\Http\Exception\NotFoundException;

class LocalizedController extends Controller
{
    
    public function initialize()
    {
        parent::initialize();
        $this->loadComponent('RequestHandler', [
            'enableBeforeRedirect' => false
        ]);
    }
    
    private function getStrings()
    {
        $strings = [
            'helper' => [
                'logoutInfoText' => __('Really_sign_out?'),
                'logout' => __('Sign_out?'),
                'routeLogout' => __('route_sign_out')
            ],
            'cart' => [
                'routeCart' => __('route_cart'),
                'emptyCart' => __('Empty_cart'),
                'deposit' => __('deposit'),
                'reallyEmptyCart' => __('Really_empty_cart?'),
                'loadPastOrder' => __('Load_past_order'),
                'loadPastOrderDescriptionHtml' => __('Load_past_order_dialog_description_html'),
                'yes' => __('Yes'),
                'cancel' => __('Cancel')
            ]
        ];
        return $strings;
    }
    
    public function strings($locale)
    {
        if (!$this->request->is('json')) {
            throw new NotFoundException();
        }
        
        $this->RequestHandler->renderAs($this, 'json');
        
        $this->set('data', [
            'localizedJs' => $this->getStrings(),
            'status' => 1,
        ]);
        
        $this->set('_serialize', 'data');
        
    }
}

?>