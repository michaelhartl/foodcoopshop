<?php
use App\Error\Exception\InvalidParameterException;
use App\Test\TestCase\AppCakeTestCase;
use Cake\ORM\TableRegistry;

/**
 * ProductTest
 *
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
class ProductTest extends AppCakeTestCase
{

    public $Product;

    public function setUp()
    {
        parent::setUp();
        $this->Product = TableRegistry::get('Products');
        // behavior needs to be attached on the fly in order not to break the app
        $this->Product->Behaviors->load('Containable');
    }

    public function testGetProductIdAndAttributeId()
    {
        $tests = [
            [
                'id' => '5',
                'result' => [
                    'productId' => 5,
                    'attributeId' => 0
                ]
            ],
            [
                'id' => 8,
                'result' => [
                    'productId' => 8,
                    'attributeId' => 0
                ]
            ],
            [
                'id' => '80-9',
                'result' => [
                    'productId' => 80,
                    'attributeId' => 9
                ]
            ]
        ];

        foreach ($tests as $test) {
            $result = $this->Product->getProductIdAndAttributeId($test['id']);
            $this->assertEquals($test['result'], $result);
        }
    }

    /**
     * START tests change quantity
     */
    public function testChangeQuantityWithOneProductAndInvalidStringQuantity()
    {
        $products = [
            [346 => 'invalid-quantity']
        ];

        $exceptionThrown = false;

        try {
            $this->Product->changeQuantity($products);
        } catch (InvalidParameterException $e) {
            $exceptionThrown = true;
        }

        $this->assertProductQuantity($products, '98');
        $this->assertSame(true, $exceptionThrown);
    }

    public function testChangeQuantityWithOneProductAndInvalidNegativeQuantity()
    {
        $products = [
            [346 => -50]
        ];

        $exceptionThrown = false;

        try {
            $this->Product->changeQuantity($products);
        } catch (InvalidParameterException $e) {
            $exceptionThrown = true;
        }

        $this->assertProductQuantity($products, '98');
        $this->assertSame(true, $exceptionThrown);
    }

    public function testChangeQuantityWithOneProduct()
    {
        $products = [
            [102 => '5']
        ];
        $this->Product->changeQuantity($products);
        $this->assertProductQuantity($products);
    }

    public function testChangeQuantityWithOneProductAttribute()
    {
        $products = [
            ['60-10' => '38']
        ];
        $this->Product->changeQuantity($products);
        $this->assertProductQuantity($products);
    }

    public function testChangeQuantityWithMultipleProductsAndAttributes()
    {
        $products = [
            [102 => '5'],
            [346 => '1'],
            ['60-10' => '90']
        ];
        $this->Product->changeQuantity($products);
        $this->assertProductQuantity($products);
    }

    public function testChangeQuantityWithMultipleProductsAndOneWithInvalidNegativeQuantity()
    {

        // 1) change quantity to same quantityto be able to test if the quantity has not changed
        $sameQuantity = '20';
        $products = [
            [346 => $sameQuantity],
            [102 => $sameQuantity],
            [161 => $sameQuantity],
        ];
        $this->Product->changeQuantity($products);
        $this->assertProductQuantity($products);

        // try to change prices, but include one invalid quantity
        $products = [
            [102 => '14'],
            [346 => '-1'], // invalid quantity
            [161 => '1']
        ];

        $exceptionThrown = false;

        try {
            $this->Product->changeQuantity($products);
        } catch (InvalidParameterException $e) {
            $exceptionThrown = true;
        }

        $this->assertProductQuantity($products, $sameQuantity);
        $this->assertSame(true, $exceptionThrown);
    }

    /**
     * START tests change price
     */
    public function testChangePriceWithOneProductAndInvalidNegativePrice()
    {

        $products = [
            [346 => '-1']
        ];

        $exceptionThrown = false;

        try {
            $this->Product->changePrice($products);
        } catch (InvalidParameterException $e) {
            $exceptionThrown = true;
        }

        $this->assertProductPrice($products, '1,82');
        $this->assertSame(true, $exceptionThrown);
    }

    public function testChangePriceOneProductAndInvalidStringPrice()
    {
        $products = [
            [346 => 'invalid-price']
        ];

        $exceptionThrown = false;

        try {
            $this->Product->changePrice($products);
        } catch (InvalidParameterException $e) {
            $exceptionThrown = true;
        }

        $this->assertProductPrice($products, '1,82');
        $this->assertSame(true, $exceptionThrown);
    }

    public function testChangePriceWithOneProduct()
    {
        $products = [
            [102 => '5,22']
        ];
        $this->Product->changePrice($products);
        $this->assertProductPrice($products);
    }

    public function testChangePriceWithOneProductAttribute()
    {
        $products = [
            ['60-10' => '3,22']
        ];
        $this->Product->changePrice($products);
        $this->assertProductPrice($products);
    }

    public function testChangePriceWithMultipleProductsAndAttributes()
    {
        $products = [
            [102 => '5,22'],
            [346 => '1,00'],
            ['60-10' => '2,98']
        ];
        $this->Product->changePrice($products);
        $this->assertProductPrice($products);
    }

    public function testChangePriceWithMultipleProductsAndOneWithInvalidNegativePrice()
    {

        // 1) change prices to same price to be able to test if the price has not changed
        $samePrice = '2,55';
        $products = [
            [346 => $samePrice],
            [102 => $samePrice],
            [161 => $samePrice],
        ];
        $this->Product->changePrice($products);
        $this->assertProductPrice($products);

        // try to change prices, but include one invalid price
        $products = [
            [102 => '2,58'],
            [346 => '-1'], // invalid price
            [161 => '1,01']
        ];

        $exceptionThrown = false;

        try {
            $this->Product->changePrice($products);
        } catch (InvalidParameterException $e) {
            $exceptionThrown = true;
        }

        $this->assertProductPrice($products, $samePrice);
        $this->assertSame(true, $exceptionThrown);
    }

    /**
     * START tests change deposit
     */

    public function testChangeDepositWithOneProduct()
    {
        $products = [
            [102 => '1,00']
        ];
        $this->Product->changeDeposit($products);
        $this->assertProductDeposit($products);
    }

    public function testChangeDepositWithOneProductAttribute()
    {
        $products = [
            ['60-10' => '1,00']
        ];
        $this->Product->changeDeposit($products);
        $this->assertProductDeposit($products);
    }

    public function testChangeDepositWithMultipleProductsAndOneWithInvalidNegativeDeposit()
    {

        // 1) change deposits to same deposit to be able to test if the price has not changed
        $sameDeposit = '1,00';
        $products = [
            [346 => $sameDeposit],
            [102 => $sameDeposit],
            [161 => $sameDeposit],
        ];
        $this->Product->changeDeposit($products);
        $this->assertProductDeposit($products);

        // try to change deposits, but include one invalid deposit
        $products = [
            [102 => '2,00'],
            [346 => '-1'], // invalid deposit
            [161 => '1,00']
        ];

        $exceptionThrown = false;

        try {
            $this->Product->changePrice($products);
        } catch (InvalidParameterException $e) {
            $exceptionThrown = true;
        }

        $this->assertProductDeposit($products, $sameDeposit);
        $this->assertSame(true, $exceptionThrown);
    }

    /**
     * START tests change status
     */

     /**
     * @expectedException InvalidParameterException
     * @expectedExceptionMessage Product.active for product 102 needs to be 0 or 1
     */
    public function testChangeStatusWithStringStatus()
    {
        $products = [
            [102 => 'invalid parameter']
        ];
        $this->Product->changeStatus($products);
    }

    /**
     * @expectedException InvalidParameterException
     * @expectedExceptionMessage Product.active for product 102 needs to be 0 or 1
     */
    public function testChangeStatusWithInvalidIntegerStatus()
    {
        $products = [
            [102 => 5] // invalid status
        ];
        $this->Product->changeStatus($products);
    }

    /**
     * @expectedException InvalidParameterException
     * @expectedExceptionMessage change status is not allowed for product attributes
     */
    public function testChangeStatusForProductAttribute()
    {
        $products = [
            ['60-10' => 0]
        ];
        $this->Product->changeStatus($products);
    }

    public function testChangeStatusDisableWithOneProduct()
    {
        $products = [
            [102 => 0]
        ];
        $response = $this->Product->changeStatus($products);
        $this->assertEquals(true, $response);
        $this->assertProductStatus($products);
    }

    public function testChangeStatusEnableWithOneProduct()
    {
        $products = [
            [102 => 1]
        ];
        $response = $this->Product->changeStatus($products);
        $this->assertEquals(true, $response);
        $this->assertProductStatus($products);
    }

    public function testChangeStatusWithMultipleProductsAndDifferentStati()
    {
        $products = [
            [102 => 1],
            [340 => 1],
            [342 => 0]
        ];
        $response = $this->Product->changeStatus($products);
        $this->assertEquals(true, $response);
        $this->assertProductStatus($products);
    }

    public function testChangeStatusWithOneProductAndInvalidStatus()
    {
        $products = [
            [102 => 5] // invalid status
        ];

        $exceptionThrown = false;

        try {
            $this->Product->changeStatus($products);
        } catch (InvalidParameterException $e) {
            $exceptionThrown = true;
        }

        $this->assertProductStatus($products, APP_ON);
        $this->assertSame(true, $exceptionThrown);
    }

    public function testChangeStatusWithMultipleProductsAndOneWithInvalidStatus()
    {
        $products = [
            [346 => 0],  // pass correct but different to current status
            [102 => -1], // invalid status
            [161 => 0]   // pass correct but different to current status
        ];

        $exceptionThrown = false;

        try {
            $this->Product->changeStatus($products);
        } catch (InvalidParameterException $e) {
            $exceptionThrown = true;
        }

        $this->assertProductStatus($products, APP_ON);
        $this->assertSame(true, $exceptionThrown);
    }

    /**
     * START helper methods
     */

    private function assertProductQuantity($products, $forceUseThisQuantity = null)
    {
        foreach ($products as $product) {
            $originalProductId = key($product);
            $productAndAttributeId = $this->Product->getProductIdAndAttributeId($originalProductId);
            $productId = $productAndAttributeId['productId'];
            $expectedQuantity = $product[$originalProductId];
            if ($forceUseThisQuantity) {
                $expectedQuantity = $forceUseThisQuantity;
            }
            if ($productAndAttributeId['attributeId'] == 0) {
                $contain = ['StockAvailables'];
            } else {
                $this->Product->hasMany['ProductAttributes']['conditions'] = ['ProductAttributes.id_product_attribute' => $productAndAttributeId['attributeId']];
                $contain = ['ProductAttributes.StockAvailable'];
            }
            $changedProduct = $this->Product->find('all', [
                'conditions' => [
                    'Products.id_product' => $productId
                ],
                'contain' => $contain
            ])->first();
            if ($productAndAttributeId['attributeId'] == 0) {
                $result = $changedProduct['StockAvailables']['quantity'];
            } else {
                $result = $changedProduct['ProductAttributes'][0]['StockAvailables']['quantity'];
            }
            $this->assertEquals($expectedQuantity, $result, 'changing the quantity flag did not work');
        }
    }

    private function assertProductDeposit($products, $forceUseThisDeposit = null)
    {
        foreach ($products as $product) {
            $originalProductId = key($product);
            $productAndAttributeId = $this->Product->getProductIdAndAttributeId($originalProductId);
            $productId = $productAndAttributeId['productId'];
            $expectedDeposit = $product[$originalProductId];
            if ($forceUseThisDeposit) {
                $expectedDeposit = $forceUseThisDeposit;
            }
            $expectedDeposit = str_replace(',', '.', $expectedDeposit);
            if ($productAndAttributeId['attributeId'] > 0) {
                $this->Product->hasMany['ProductAttributes']['conditions'] = ['ProductAttributes.id_product_attribute' => $productAndAttributeId['attributeId']];
            }

            $changedProduct = $this->Product->find('all', [
                'conditions' => [
                    'Products.id_product' => $productId
                ]
            ])->first();

            if ($productAndAttributeId['attributeId'] == 0) {
                $resultEntity = $changedProduct['DepositProduct'];
            } else {
                $resultEntity = $changedProduct['ProductAttributes'][0]['DepositProductAttribute'];
            }
            $this->assertEquals($expectedDeposit, $this->Product->getPriceAsFloat($resultEntity['deposit']), 'changing the deposit did not work');
        }
    }

    private function assertProductPrice($products, $forceUseThisPrice = null)
    {
        foreach ($products as $product) {
            $originalProductId = key($product);
            $productAndAttributeId = $this->Product->getProductIdAndAttributeId($originalProductId);
            $productId = $productAndAttributeId['productId'];
            $expectedPrice = $product[$originalProductId];
            if ($forceUseThisPrice) {
                $expectedPrice = $forceUseThisPrice;
            }
            $expectedPrice = str_replace(',', '.', $expectedPrice);
            if ($productAndAttributeId['attributeId'] == 0) {
                $contain = ['ProductShop'];
            } else {
                $this->Product->hasMany['ProductAttributes']['conditions'] = ['ProductAttributes.id_product_attribute' => $productAndAttributeId['attributeId']];
                $contain = ['ProductAttributes.ProductAttributeShop'];
            }
            $changedProduct = $this->Product->find('all', [
                'conditions' => [
                    'Products.id_product' => $productId
                ],
                'contain' => $contain
            ])->first();
            if ($productAndAttributeId['attributeId'] == 0) {
                $resultEntity = $changedProduct['ProductShop'];
            } else {
                $resultEntity = $changedProduct['ProductAttributes'][0]['ProductAttributeShops'];
            }
            $this->assertEquals($expectedPrice, $this->Product->getGrossPrice($productId, $resultEntity['price']), 'changing the price did not work');
        }
    }

    private function assertProductStatus($products, $forceUseThisStatus = null)
    {
        foreach ($products as $product) {
            $productId = key($product);
            $expectedStatus = $product[$productId];
            if ($forceUseThisStatus) {
                $expectedStatus = $forceUseThisStatus;
            }
            $changedProduct = $this->Product->find('all', [
                'conditions' => [
                    'Products.id_product' => $productId,
                ]
            ])->first();
            $this->assertEquals($expectedStatus, $changedProduct['Products']['active'], 'changing the active flag did not work');
        }
    }
}
