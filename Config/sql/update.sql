ALTER TABLE `fcs_orders` ADD `general_terms_and_conditions_accepted` TINYINT(4) UNSIGNED NOT NULL AFTER `total_deposit`, ADD `cancellation_terms_accepted` TINYINT(4) UNSIGNED NOT NULL AFTER `general_terms_and_conditions_accepted`;
