<?php
/**
 * @file classes/components/forms/PublicationForm.php
 *
 * Copyright (c) 2025 KOMET project, OPTIMETA project, Daniel Nüst, Tom Niers
 * Distributed under the GNU GPL v3. For full terms see the file docs/COPYING.
 *
 * @class PublicationForm
 *
 * @brief A preset form for setting a publication's spatio-temporal metadata.
 */

namespace geoMetadata\classes\Components\Forms;

import('lib.pkp.classes.form.Form');

use FormValidatorPost;
use FormValidatorCSRF;
use Application;
use TemplateManager;
use NotificationManager;

/**
 * Form for the geoMetadata settings. 
 */
class SettingsForm extends \Form
{
    public $plugin;
    
    /**
     * @desc Array of variables saved in the database
     * @var string[]
     */
    private $settings = [
        'geoMetadata_geonames_username',
        'geoMetadata_geonames_baseurl',
        'geoMetadata_showDownloadSidebar'
    ];

    public function __construct($plugin)
    {

        // Define the settings template and store a copy of the plugin object
        parent::__construct($plugin->getTemplateResource('settings.tpl'));
        $this->plugin = $plugin;

        // Always add POST and CSRF validation to secure your form.
        $this->addCheck(new FormValidatorPost($this));
        $this->addCheck(new FormValidatorCSRF($this));
    }

    /**
     * Load settings already saved in the database
     *
     * Settings are stored by context, so that each journal or press
     * can have different settings.
     */
    public function initData()
    {
        $context = Application::get()->getRequest()->getContext();
        $contextId = $context ? $context->getId() : CONTEXT_SITE;
        foreach($this->settings as $key){
            $value = $this->plugin->getSetting($contextId, $key);
            // Default the sidebar download toggle to "on" when it has never been saved,
            // so the checkbox appears pre-ticked on first open and the frontend behavior
            // matches pre-issue-#55 installs.
            if ($key === 'geoMetadata_showDownloadSidebar' && $value === null) {
                $value = true;
            }
            $this->setData($key, $value);
        }

        parent::initData();
    }

    /**
     * Load data that was submitted with the form
     */
    public function readInputData()
    {
        foreach($this->settings as $key){
            $this->readUserVars([$key]);
        }
        // Unchecked checkboxes are absent from the POST body, so readUserVars() leaves the
        // value as null — indistinguishable at read time from "never saved". Coerce to '0'
        // so the stored value after save is always definite ('0' or '1'), which lets the
        // plugin hook treat null-from-getSetting() as "never saved, default on".
        if ($this->getData('geoMetadata_showDownloadSidebar') === null) {
            $this->setData('geoMetadata_showDownloadSidebar', '0');
        }
        parent::readInputData();
    }

    /**
     * Fetch any additional data needed for your form.
     *
     * Data assigned to the form using $this->setData() during the
     * initData() or readInputData() methods will be passed to the
     * template.
     */
    public function fetch($request, $template = null, $display = false)
    {

        // Pass the plugin name to the template so that it can be
        // used in the URL that the form is submitted to
        $templateMgr = TemplateManager::getManager($request);
        $templateMgr->assign('pluginName', $this->plugin->getName());

        return parent::fetch($request, $template, $display);
    }

    /**
     * Save the settings
     */
    public function execute(...$functionArgs)
    {
        $context = Application::get()->getRequest()->getContext();
        $contextId = $context ? $context->getId() : CONTEXT_SITE;

        foreach($this->settings as $key){
            $this->plugin->updateSetting( $contextId, $key, $this->getData($key));
        }
        
        // Tell the user that the save was successful.
        import('classes.notification.NotificationManager');
        $notificationMgr = new NotificationManager();
        $notificationMgr->createTrivialNotification(
            Application::get()->getRequest()->getUser()->getId(),
            NOTIFICATION_TYPE_SUCCESS,
            ['contents' => __('common.changesSaved')]
        );

        return parent::execute();
    }
}
