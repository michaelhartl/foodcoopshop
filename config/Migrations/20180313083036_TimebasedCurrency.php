<?php
use Migrations\AbstractMigration;

class TimebasedCurrency extends AbstractMigration
{
    public function change()
    {
        $this->execute("
            
            UPDATE fcs_configuration SET position = 190 WHERE name = 'FCS_BACKUP_EMAIL_ADDRESS_BCC';
            INSERT INTO `fcs_configuration` (`id_configuration`, `active`, `name`, `text`, `value`, `type`, `position`, `date_add`, `date_upd`) VALUES (NULL, '1', 'FCS_TIMEBASED_CURRENCY_ENABLED', 'Stundenabrechnungs-Modul aktiv?<br /><div class=\"small\"><a href=\"https://foodcoopshop.github.io/de/stundenabrechnungs-modul\" target=\"_blank\">Infos zum Stundenabrechnungs-Modul</a></div>', '0', 'boolean', '200', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            INSERT INTO `fcs_configuration` (`id_configuration`, `active`, `name`, `text`, `value`, `type`, `position`, `date_add`, `date_upd`) VALUES (NULL, '1', 'FCS_TIMEBASED_CURRENCY_NAME', 'Stundenabrechnung: Name der Einheit<br /><div class=\"small\">max. 10 Zeichen</div>', 'Stunden', 'text', '210', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            INSERT INTO `fcs_configuration` (`id_configuration`, `active`, `name`, `text`, `value`, `type`, `position`, `date_add`, `date_upd`) VALUES (NULL, '1', 'FCS_TIMEBASED_CURRENCY_SHORTCODE', 'Stundenabrechnung: Abkürzung<br /><div class=\"small\">max. 3 Zeichen</div>', 'h', 'text', '220', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            INSERT INTO `fcs_configuration` (`id_configuration`, `active`, `name`, `text`, `value`, `type`, `position`, `date_add`, `date_upd`) VALUES (NULL, '1', 'FCS_TIMEBASED_CURRENCY_EXCHANGE_RATE', 'Stundenabrechnung: Umrechnungskurs<br /><div class=\"small\">in €, 2 Kommastellen</div>', '10,00', 'number', '230', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            INSERT INTO `fcs_configuration` (`id_configuration`, `active`, `name`, `text`, `value`, `type`, `position`, `date_add`, `date_upd`) VALUES (NULL, '1', 'FCS_TIMEBASED_CURRENCY_MAX_CREDIT_BALANCE_CUSTOMER', 'Stundenabrechnung: Überziehungsrahmen für Mitglieder<br /><div class=\"small\">Wie viele Stunden kann ein Mitglied maximal ins Minus gehen?</div>', '0', 'number', '240', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            INSERT INTO `fcs_configuration` (`id_configuration`, `active`, `name`, `text`, `value`, `type`, `position`, `date_add`, `date_upd`) VALUES (NULL, '1', 'FCS_TIMEBASED_CURRENCY_MAX_CREDIT_BALANCE_MANUFACTURER', 'Stundenabrechnung: Überziehungsrahmen für Hersteller<br /><div class=\"small\">Wie viele Stunden kann ein Hersteller maximal ins Plus gehen?</div>', '0', 'number', '250', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            
            ALTER TABLE `fcs_manufacturer`
                ADD `timebased_currency_enabled` TINYINT UNSIGNED NOT NULL DEFAULT '0' AFTER `enabled_sync_domains`,
                ADD `timebased_currency_max_percentage` TINYINT UNSIGNED NOT NULL DEFAULT '30' AFTER `timebased_currency_enabled`,
                ADD `timebased_currency_max_credit_balance` INT(7) UNSIGNED NULL DEFAULT '360000' AFTER `timebased_currency_max_percentage`;
            
            ALTER TABLE `fcs_customer` ADD `timebased_currency_enabled` TINYINT UNSIGNED NOT NULL DEFAULT '0' AFTER `date_upd`;

            CREATE TABLE `fcs_timebased_currency_orders` (
              `id_order` int(11) NOT NULL DEFAULT '0',
              `money_excl_sum` decimal(10,6) UNSIGNED DEFAULT NULL,
              `money_incl_sum` decimal(10,6) UNSIGNED DEFAULT NULL,
              `seconds_sum` int(7) UNSIGNED DEFAULT NULL,
              UNIQUE KEY `id_order` (`id_order`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

            CREATE TABLE `fcs_timebased_currency_order_detail` (
              `id_order_detail` int(11) NOT NULL DEFAULT '0',
              `money_excl` decimal(10,6) UNSIGNED DEFAULT NULL,
              `money_incl` decimal(10,6) UNSIGNED DEFAULT NULL,
              `seconds` int(7) UNSIGNED DEFAULT NULL,
              `max_percentage` int(11) UNSIGNED DEFAULT NULL,
              `exchange_rate` decimal(6,2) UNSIGNED DEFAULT NULL,
              UNIQUE KEY `id_order_detail` (`id_order_detail`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

            ALTER TABLE `fcs_order_detail` DROP `unit_price_tax_incl`, DROP `unit_price_tax_excl`;

            ALTER TABLE `fcs_product` DROP INDEX `created`;
            ALTER TABLE `fcs_product` DROP INDEX `id_category_default`;

            CREATE TABLE `fcs_timebased_currency_payments` (
              `id` int(10) NOT NULL AUTO_INCREMENT,
              `id_customer` int(10) UNSIGNED DEFAULT NULL,
              `id_manufacturer` int(11) UNSIGNED DEFAULT NULL,
              `seconds` int(7) NOT NULL DEFAULT '0.00',
              `text` varchar(255) NOT NULL DEFAULT '',
              `working_day` date DEFAULT NULL,
              `created` datetime DEFAULT NULL,
              `modified` datetime DEFAULT NULL,
              `status` tinyint(4) NOT NULL DEFAULT '1',
              `approval` tinyint(4) NOT NULL DEFAULT '0',
              `approval_comment` text NOT NULL,
              `modified_by` int(10) UNSIGNED DEFAULT NULL,
              `created_by` int(10) UNSIGNED DEFAULT NULL,
              PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

        ");
    }
}
