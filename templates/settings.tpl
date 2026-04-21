{*template settings for geoMetadata.'*}
<script>
    $(function() {ldelim}
    $('#geoMetadataSettings').pkpHandler('$.pkp.controllers.form.AjaxFormHandler');
    {rdelim});
</script>

<form class="pkp_form" id="geoMetadataSettings" method="POST"
    action="{url router=$smarty.const.ROUTE_COMPONENT op="manage" category="generic" plugin=$pluginName verb="settings" save=true}">
    <!-- Always add the csrf token to secure your form -->
    {csrf}

    {fbvFormArea id="geoMetadataSettingsArea"}

    {fbvFormSection title="plugins.generic.geoMetadata.settings.section.frontend" list=true}
    <p align="justify" class="description" style="color: rgba(0,0,0,0.54)">
        {translate key="plugins.generic.geoMetadata.settings.showDownloadSidebar.description"}
        {fbvElement
        type="checkbox"
        id="geoMetadata_showDownloadSidebar"
        value="1"
        checked=$geoMetadata_showDownloadSidebar
        label="plugins.generic.geoMetadata.settings.showDownloadSidebar"
        }
    </p>
    {/fbvFormSection}

    {fbvFormSection title="plugins.generic.geoMetadata.settings.section.accounts" list=true}
    <p align="justify" class="description" style="color: rgba(0,0,0,0.54)">
        {translate key="plugins.generic.geoMetadata.settings.usernameGeonames.description"}
        {fbvElement
        type="text"
        id="geoMetadata_geonames_username"
        value=$geoMetadata_geonames_username
        label="plugins.generic.geoMetadata.settings.usernameGeonames"
        }
    </p>
    <p align="justify" class="description" style="color: rgba(0,0,0,0.54)">
        {translate key="plugins.generic.geoMetadata.settings.baseurlGeonames.description"}
        {fbvElement
        type="text"
        id="geoMetadata_geonames_baseurl"
        value=$geoMetadata_geonames_baseurl
        label="plugins.generic.geoMetadata.settings.baseurlGeonames"
        }
    </p>
    {/fbvFormSection}

    {/fbvFormArea}
    {fbvFormButtons submitText="common.save"}
</form>
