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

    {fbvFormSection title="plugins.generic.geoMetadata.settings.section.maps" list=true}
    <p align="justify" class="description" style="color: rgba(0,0,0,0.54)">
        {translate key="plugins.generic.geoMetadata.settings.showEsriBaseLayer.description"}
        {fbvElement
        type="checkbox"
        id="geoMetadata_showEsriBaseLayer"
        value="1"
        checked=$geoMetadata_showEsriBaseLayer
        label="plugins.generic.geoMetadata.settings.showEsriBaseLayer"
        }
    </p>
    <p align="justify" class="description" style="color: rgba(0,0,0,0.54)">
        {translate key="plugins.generic.geoMetadata.settings.privacy.info"}
    </p>
    <textarea id="geoMetadata_privacySnippet" readonly rows="8"
        style="width: 100%; font-family: monospace; font-size: 12px;">{translate key="plugins.generic.geoMetadata.privacy.snippet.osm"}{if $geoMetadata_showEsriBaseLayer}
{translate key="plugins.generic.geoMetadata.privacy.snippet.esri"}{/if}
{translate key="plugins.generic.geoMetadata.privacy.snippet.legitimateInterest"}</textarea>
    {* Raw translation sources read from the DOM by the live-update script below, *}
    {* which avoids JS-string escaping for snippets that contain quotes and HTML. *}
    <script type="text/plain" id="geoMetadata_privacySnippet_osm">{translate key="plugins.generic.geoMetadata.privacy.snippet.osm"}</script>
    <script type="text/plain" id="geoMetadata_privacySnippet_esri">{translate key="plugins.generic.geoMetadata.privacy.snippet.esri"}</script>
    <script type="text/plain" id="geoMetadata_privacySnippet_legitimateInterest">{translate key="plugins.generic.geoMetadata.privacy.snippet.legitimateInterest"}</script>
    <script>
    (function() {ldelim}
        var checkbox = document.getElementById('geoMetadata_showEsriBaseLayer');
        var textarea = document.getElementById('geoMetadata_privacySnippet');
        if (!checkbox || !textarea) return;
        var osm  = document.getElementById('geoMetadata_privacySnippet_osm').textContent;
        var esri = document.getElementById('geoMetadata_privacySnippet_esri').textContent;
        var leg  = document.getElementById('geoMetadata_privacySnippet_legitimateInterest').textContent;
        function geoMetadata_updatePrivacySnippet() {ldelim}
            textarea.value = osm + (checkbox.checked ? '\n' + esri : '') + '\n' + leg;
        {rdelim}
        checkbox.addEventListener('change', geoMetadata_updatePrivacySnippet);
    {rdelim})();
    </script>
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
