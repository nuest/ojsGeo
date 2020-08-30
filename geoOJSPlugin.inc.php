<?php
// import of genericPlugin
import('lib.pkp.classes.plugins.GenericPlugin');

use phpDocumentor\Reflection\Types\Null_;
use \PKP\components\forms\FormComponent;

/**
 * geoOJSPlugin, a generic Plugin for enabling geospatial properties in OJS 
 */
class geoOJSPlugin extends GenericPlugin
{
	public function register($category, $path, $mainContextId = NULL)
	{

		// Register the plugin even when it is not enabled
		$success = parent::register($category, $path, $mainContextId);
		// important to check if plugin is enabled before registering the hook, cause otherwise plugin will always run no matter enabled or disabled! 
		if ($success && $this->getEnabled()) {

			/* 
			Hooks are the possibility to intervene the application. By the corresponding function which is named in the HookRegistery, the application
			can be changed. 
			Further information here: https://docs.pkp.sfu.ca/dev/plugin-guide/en/categories#generic 
			*/

			// Hook for changing the frontent and adding a new form 
			// Templates::Submission::SubmissionMetadataForm::AdditionalMetadata -> Template for Submission Step 3 
			HookRegistry::register('Templates::Submission::SubmissionMetadataForm::AdditionalMetadata', array($this, 'extendSubmissionMetadataFormTemplate'));
			HookRegistry::register('Form::config::before', array($this, 'extendScheduleForPublication'));
			HookRegistry::register('Template::Workflow::Publication', array($this, 'extendScheduleForPublication2'));
			HookRegistry::register('Templates::Submission::SubmissionMetadataForm::AdditionalMetadata', array($this, 'doSomething'));
			HookRegistry::register('Templates::Submission::SubmissionMetadataForm::AdditionalMetadata', array(&$this, 'addGeospatialProperties'));
			HookRegistry::register('Templates::Submission::SubmissionMetadataForm::AdditionalMetadata', array(&$this, 'storeGeospatialProperties'));

			// Hook for changing the article page 
			HookRegistry::register('Templates::Article::Main', array(&$this, 'extendArticleMainTemplate'));
			// ArticleHandler::view -> general Article view 
			// Templates::Article::Main 
			// Templates::Article::Details
			// Templates::Article::Footer::PageFooter

			// Hook for creating and setting a new field in the database 
			HookRegistry::register('Schema::get::publication', array($this, 'addToSchema'));
			HookRegistry::register('Publication::edit', array($this, 'editPublication')); // Take care, hook is called twice, first during Submission Workflow and also before Schedule for Publication in the Review Workflow!!!


			$request = Application::get()->getRequest();
			$templateMgr = TemplateManager::getManager($request);

			/*
			To respect the enable_cdn configuration setting. When this is off, 
			plugins should not load any scripts or styles from a third-party website.
			*/
			if (Config::getVar('general', 'enable_cdn')) {
				$urlLeafletCSS = 'https://unpkg.com/leaflet@1.6.0/dist/leaflet.css';
				$urlLeafletJS = 'https://unpkg.com/leaflet@1.6.0/dist/leaflet.js';
				$urlLeafletDrawCSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css';
				$urlLeafletDrawJS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js';
				// $urlJqueryJS = 'https://code.jquery.com/jquery-3.2.1.js';
				// jquery no need to load, already loaded here: ojs/lib/pkp/classes/template/PKPTemplateManager.inc.php 
				$urlMomentJS = 'https://cdn.jsdelivr.net/momentjs/latest/moment.min.js';
				$urlDaterangepickerJS = 'https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.min.js';
				$urlDaterangepickerCSS = 'https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.css';
				$urlLeafletControlGeocodeJS = 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js';
				$urlLeafletControlGeocodeCSS = 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css';
			} else {
				$urlLeafletCSS = $request->getBaseUrl() . '/' . $this->getPluginPath() . '/enable_cdn_Off/leaflet/leaflet.css';
				$urlLeafletJS = $request->getBaseUrl() . '/' . $this->getPluginPath() . '/enable_cdn_Off/leaflet/leaflet.js';
				$urlLeafletDrawCSS = $request->getBaseUrl() . '/' . $this->getPluginPath() . '/enable_cdn_Off/leaflet-draw/leaflet.draw.css';
				$urlLeafletDrawJS = $request->getBaseUrl() . '/' . $this->getPluginPath() . '/enable_cdn_Off/leaflet-draw/leaflet.draw.js';
				// $urlJqueryJS = $request->getBaseUrl() . '/' . $this->getPluginPath() . '/enable_cdn_Off/daterangepicker/jquery.min.js';
				// jquery - no need to load, already loaded here: ojs/lib/pkp/classes/template/PKPTemplateManager.inc.php 
				$urlMomentJS = $request->getBaseUrl() . '/' . $this->getPluginPath() . '/enable_cdn_Off/daterangepicker/moment.min.js';
				$urlDaterangepickerJS = $request->getBaseUrl() . '/' . $this->getPluginPath() . '/enable_cdn_Off/daterangepicker/daterangepicker.min.js';
				$urlDaterangepickerCSS = $request->getBaseUrl() . '/' . $this->getPluginPath() . '/enable_cdn_Off/daterangepicker/daterangepicker.css';
				$urlLeafletControlGeocodeJS = $request->getBaseUrl() . '/' . $this->getPluginPath() . '/enable_cdn_Off/leaflet-control-geocoder/dist/Control.Geocoder.js';
				$urlLeafletControlGeocodeCSS = $request->getBaseUrl() . '/' . $this->getPluginPath() . '/enable_cdn_Off/leaflet-control-geocoder/dist/Control.Geocoder.css';
			}

			/*
			Here further scripts like JS and CSS are included, 
			these are included by the following lines and need not be referenced (e.g. in .tbl files).
			Further information can be found here: https://docs.pkp.sfu.ca/dev/plugin-guide/en/examples-styles-scripts
			*/
			/*
			loading the leaflet scripts
			source: https://leafletjs.com/examples/quick-start/
			*/
			$templateMgr->addStyleSheet('leafletCSS', $urlLeafletCSS, array('contexts' => array('frontend', 'backend')));
			$templateMgr->addJavaScript('leafletJS', $urlLeafletJS, array('contexts' => array('frontend', 'backend')));

			/* 
			loading the leaflet draw scripts 
			source: https://www.jsdelivr.com/package/npm/leaflet-draw?path=dist
			*/
			$templateMgr->addStyleSheet("leafletDrawCSS", $urlLeafletDrawCSS, array('contexts' => array('frontend', 'backend')));
			$templateMgr->addJavaScript("leafletDrawJS", $urlLeafletDrawJS, array('contexts' => array('frontend', 'backend')));


			/*
			loading the daterangepicker scripts 
			source: https://www.daterangepicker.com/#example2 
			*/
			//$templateMgr->addJavaScript("jqueryJS", $urlJqueryJS, array('contexts' => array('frontend', 'backend')));
			// jquery no need to load, already loaded here: ojs/lib/pkp/classes/template/PKPTemplateManager.inc.php 
			$templateMgr->addJavaScript("momentJS", $urlMomentJS, array('contexts' => array('frontend', 'backend')));
			$templateMgr->addJavaScript("daterangepickerJS", $urlDaterangepickerJS, array('contexts' => array('frontend', 'backend')));
			$templateMgr->addStyleSheet("daterangepickerCSS", $urlDaterangepickerCSS, array('contexts' => array('frontend', 'backend')));

			/*
			loading leaflet control geocoder (search)
			source: https://github.com/vladimirbuskin/leaflet-control-geocoder 
			*/
			$templateMgr->addJavaScript("leafletControlGeocodeJS", $urlLeafletControlGeocodeJS, array('contexts' => array('frontend', 'backend')));
			$templateMgr->addStyleSheet("leafletControlGeocodeCSS", $urlLeafletControlGeocodeCSS, array('contexts' => array('frontend', 'backend')));

			// main js script for loading leaflet
			$templateMgr->assign('submissionMetadataFormFieldsJS', $request->getBaseUrl() . '/' . $this->getPluginPath() . '/js/submissionMetadataFormFields.js');
			$templateMgr->assign('article_detailsJS', $request->getBaseUrl() . '/' . $this->getPluginPath() . '/js/article_details.js');
		}
		return $success;
	}


	/**
	 * Function which extends the sumbmissionMetadataFormFields template.
	 * @param hook Templates::Submission::SubmissionMetadataForm::AdditionalMetadata
	 */
	public function extendSubmissionMetadataFormTemplate($hookName, $params)
	{
		$templateMgr = &$params[1];
		$output = &$params[2];

		/*
		TODO Datenabfrage
		$publication = $templateMgr->getTemplateVars('publication');
		$submission = $templateMgr->getTemplateVars('article');
		$submissionId = $submission->getId();
		*/

		// example: by the arrow is used to to access the attribute smarty of the variable smarty 
		// $templateMgr = $smarty->smarty; 

		$request = Application::get()->getRequest(); // alternativ auch "&$args[0];" aber dann geht "$request->getUserVar('submissionId');" nicht
		//$issue = &$args[1]; // wird auch genannt: smarty 
		//$article = &$args[2]; // wird auch genannt: output

		/*
		This way templates are loaded. 
		Its important that the corresponding hook is activated. 
		If you want to override a template you need to create a .tpl-file which is in the plug-ins template path which the same 
		path it got in the regular ojs structure. E.g. if you want to override/ add something to this template 
		/Users/tomniers/Desktop/ojs_stuff/ojs/lib/pkp/templates/submission/submissionMetadataFormTitleFields.tpl
		you have to store in in the plug-ins template path under this path submission/form/submissionMetadataFormFields.tpl. 
		Further details can be found here: https://docs.pkp.sfu.ca/dev/plugin-guide/en/templates
		Where are templates located: https://docs.pkp.sfu.ca/pkp-theming-guide/en/html-smarty
		*/
		// echo "TestTesTest"; // by echo a direct output is created on the page

		$output .= $templateMgr->fetch($this->getTemplateResource('submission/form/submissionMetadataFormFields.tpl'));

		return false;
	}

	/**
	 * Function which extends ArticleMain Template by spatial- and temporal properties. 
	 * Data is loaded from the database, passed as template variable to the 'article_details.tpl' 
	 * and requested from there in the 'article_details.js' to display coordinates in a map and 
	 * dates in a calendar. 
	 * @param hook Templates::Article::Main
	 */
	public function extendArticleMainTemplate($hookName, $params)
	{
		$templateMgr = &$params[1];
		$output = &$params[2];

		$publication = $templateMgr->getTemplateVars('publication');
		$submission = $templateMgr->getTemplateVars('article');
		$submissionId = $submission->getId();

		// get data from database 
		$temporalProperties = $publication->getData('geoOJS::timestamp');
		$spatialProperties = $publication->getData('geoOJS::spatialProperties');
		$administrativeUnit = $publication->getData('coverage');

		// for the case that no data is available 
		if ($temporalProperties === null) {
			$temporalProperties = 'no data';
		}

		if ($spatialProperties === null || $spatialProperties === '') {
			$spatialProperties = 'no data';
		}

		if (current($administrativeUnit) === '' || $administrativeUnit === '') {
			$administrativeUnit = 'no data';
		}

		//assign data as variables to the template 
		$templateMgr->assign('temporalProperties', $temporalProperties);
		$templateMgr->assign('spatialProperties', $spatialProperties);
		$templateMgr->assign('administrativeUnit', $administrativeUnit);

		$output .= $templateMgr->fetch($this->getTemplateResource('frontend/objects/article_details.tpl'));

		return false;
	}

	// not working function to add a form before Schedule for Publication 
	public function extendScheduleForPublication(string $hookName, FormComponent $form): void
	{
		if ($form->id !== 'metadata' || !empty($form->errors)) return;

		if ($form->id === 'metadata') {

			/*
			$publication = Services::get('publication');
			$temporalProperties = $publication->getData('geoOJS::timestamp');
			$spatialProperties = $publication->getData('geoOJS::spatialProperties');
			*/

			$form->addField(new \PKP\components\forms\FieldOptions('jatsParser::references', [
				'label' => 'Hello',
				'description' => 'Hello',
				'type' => 'radio',
				'options' => null,
				'value' => null
			]));
		}
	}

	// not working function to write something in Schedule for Publication 
	public function extendScheduleForPublication2($hookName, $params)
	{
		$templateMgr = &$params[1];
		$output = &$params[2];


		echo "<p> Hello </p>";

		// $output .= $templateMgr->fetch($this->getTemplateResource('frontend/objects/article_details.tpl'));

		return false;
	}


	/**
	 * Function which extends the schema of the publication_settings table in the database. 
	 * There are two further rows in the table one for the spatial properties, and one for the timestamp 
	 * @param hook Schema::get::publication
	 */
	public function addToSchema($hookName, $args)
	{
		// possible types: integer, string, text 
		$schema = $args[0];

		$timestamp = '{
			"type": "string",
			"multilingual": false,
			"apiSummary": true,
			"validation": [
				"nullable"
			]
		}';
		$timestampDecoded = json_decode($timestamp);
		$schema->properties->{'geoOJS::timestamp'} = $timestampDecoded;

		$spatialProperties = '{
			"type": "string",
			"multilingual": false,
			"apiSummary": true,
			"validation": [
				"nullable"
			]
		}';
		$spatialPropertiesDecoded = json_decode($spatialProperties);
		$schema->properties->{'geoOJS::spatialProperties'} = $spatialPropertiesDecoded;
	}

	/**
	 * Function which fills the new fields (created by the function addToSchema) in the schema. 
	 * The data is collected using the "ojs.js", then passed as input to the "submissionMetadataFormFields.js" 
	 * and requested from it in this php script by a POST-method. 
	 * @param hook Publication::edit
	 */
	function editPublication(string $hookname, array $args)
	{
		$newPublication = $args[0];
		$params = $args[2];

		$temporalProperties = $_POST['temporalProperties'];
		$spatialProperties = $_POST['spatialProperties'];
		$administrativeUnit = $_POST['administrativeUnit'];

		/*
		In php you can use json_decode and json_encode, similar to JSON.parse and JSON.stringify in js! 
		$spatialPropertiesDecoded = json_decode($spatialProperties);
		$spatialPropertiesEncoded = json_encode($spatialPropertiesDecoded);
		*/

		$exampleTimestamp = '2020-08-12 11:00 AM - 2020-08-13 07:00 PM';
		$exampleSpatialProperties = '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[7.516193389892579,51.94553466305084],[7.516193389892579,51.96447134091556],[7.56511688232422,51.96447134091556],[7.56511688232422,51.94553466305084],[7.516193389892579,51.94553466305084]]]},"properties":{"name":"TODO Administrative Unit"}}]}';
		$exampleCoverageElement = 'TODO';

		/*
		If the element to store in the database is an element which is different in different languages 
		the property "multilingual" in the function addToSchema has to be true, and you have to use a loop like this 

		$localePare = $params['title'];

		foreach ($localePare as $localeKey => $fileId) {
			$newPublication->setData('jatsParser::fullText', $htmlDocument->saveAsHTML(), $localeKey);
		}

		further information: https://github.com/Vitaliy-1/JATSParserPlugin/blob/21425c486f0f157cd8dc6b829322cd32159dd408/JatsParserPlugin.inc.php#L619 

		For elements which are not multilangual you can skip the parameter $localeKey and just do it like this: 
			$newPublication->setData('geoOJS::spatialProperties', $spatialProperties);

		Take care, function is called twice, first during Submission Workflow and also before Schedule for Publication in the Review Workflow!!!
		*/

		// null if there is no possibility to input data (metadata input before Schedule for Publication)
		// "" if the author does not input something 
		if ($spatialProperties !== null) {
			$newPublication->setData('geoOJS::spatialProperties', $spatialProperties);
		}

		if ($temporalProperties !== null && $temporalProperties !== "") {
			$newPublication->setData('geoOJS::timestamp', $temporalProperties);
		}

		if ($administrativeUnit !== null) {
			$newPublication->setData('coverage', $administrativeUnit);
		}

		/*
		The following lines are probably needed if you want to store text in a certain language to set the local key,
		further information can be found here:
		https://github.com/Vitaliy-1/JATSParserPlugin/blob/21425c486f0f157cd8dc6b829322cd32159dd408/JatsParserPlugin.inc.php#L619 
		$yourdata3 = 'Guuuten Tag';
		$localePare = $params['title'];
		foreach ($localePare as $localeKey => $fileId) {
			continue;
		}
		$newPublication->setData('Textfeld', $yourdata3, $localeKey);

		$yourdata = 100;
		$yourdata2 = '00:00:00';
		*/
	}

	/**
	 * function for simple outputs. 
	 */
	/*
	public function doSomething($hookName, $args)
	{
		$request = Application::get()->getRequest(); // alternativly "&$args[0];" but then "$request->getUserVar('submissionId');" is not possible
		$msarty = &$args[1];
		$article = &$args[2];

		// to get the Id of the actual submission
		$submissionId = $request->getUserVar('submissionId');
		// $currentUser = $request->getUser();

		// $article .= $currentUser;
		$article .= $submissionId;
		$article .= "<p> Hier könnte Ihre Werbung stehen </p> <p> schlechte Werbung</p>";

		return false;
	}*/

	/**
	 * Provide a name for this plugin (plugin gallery)
	 *
	 * The name will appear in the Plugin Gallery where editors can
	 * install, enable and disable plugins.
	 */
	public function getDisplayName()
	{
		return __('plugins.generic.geoOJS.name');
	}

	/**
	 * Provide a description for this plugin (plugin gallery) 
	 *
	 * The description will appear in the Plugin Gallery where editors can
	 * install, enable and disable plugins.
	 */
	public function getDescription()
	{
		return __('plugins.generic.geoOJS.description');
	}
}
