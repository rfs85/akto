package com.akto.action.testing;

import com.akto.dao.SampleDataDao;
import com.akto.dao.testing.config.TestCollectionPropertiesDao;
import com.akto.dto.ApiInfo;
import com.akto.dto.testing.config.TestCollectionProperty;
import com.akto.dto.traffic.SampleData;
import com.akto.store.StandardHeaders;
import com.google.gson.Gson;
import com.mongodb.BasicDBObject;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;
import com.mongodb.client.model.Sorts;
import com.opensymphony.xwork2.Action;
import okhttp3.*;
import org.apache.commons.lang3.NotImplementedException;
import org.bson.conversions.Bson;

import java.io.IOException;
import java.util.*;

import static com.akto.dto.OriginalHttpRequest.buildHeadersMap;
import static com.opensymphony.xwork2.Action.SUCCESS;

public class TestCollectionConfigurationAction {
    private static final Gson gson = new Gson();

    public String execute() {
        throw new NotImplementedException("TestCollectionConfigurationAction - default method not implemented");
    }

    int apiCollectionId;

    List<TestCollectionProperty> testCollectionProperties;

    public String fetchTestCollectionConfiguration() {
        this.testCollectionProperties = TestCollectionPropertiesDao.fetchConfigs(apiCollectionId);
        return SUCCESS.toUpperCase();
    }

    public List<String> extractCookieKeys(String cookie) {
        List<String> ret = new ArrayList<>();
        String[] cookiesKV = cookie.split(";");
        for(String cookieKVSingle: cookiesKV) {
            String[] cookieKVArr = cookieKVSingle.split("=");
            if (cookieKVArr.length == 2) {
                ret.add(cookieKVArr[0].toLowerCase());
            }
        }

        return ret;
    }

    public Set<String> findNonStandardHeaderKeys(int apiCollectionId) {
        List<SampleData> sampleDataList = new ArrayList<>();
        Bson filters = Filters.empty();//Filters.eq("_id."+ ApiInfo.ApiInfoKey.API_COLLECTION_ID, apiCollectionId);
        int skip = 0;
        int limit = 100;
        Set<String> headerNames = new HashSet<>();
        Bson sort = Sorts.ascending("_id.apiCollectionId", "_id.url", "_id.method");
        do {
            sampleDataList = SampleDataDao.instance.findAll(filters, skip, limit, sort, Projections.slice(SampleData.SAMPLES, 1));
            skip += limit;
            for(SampleData sampleData: sampleDataList) {
                for(String sample: sampleData.getSamples()) {
                    Map<String, Object> json = gson.fromJson(sample, Map.class);
                    Map<String, List<String>> reqHeaders = buildHeadersMap(json, "requestHeaders");
                    List<String> cookieList = reqHeaders.getOrDefault("cookie", reqHeaders.get("Cookie"));
                    if (cookieList != null && !cookieList.isEmpty()) {
                        String cookieString = cookieList.get(0);
                        headerNames.addAll(extractCookieKeys(cookieString));
                    }

                    for(String header: reqHeaders.keySet()) {
                        headerNames.add(header.toLowerCase());
                    }

                    break;
                }
                if (headerNames.size() > 10_000) {
                    break;
                }
            }
        } while (!sampleDataList.isEmpty() && headerNames.size() <= 10_000);

        headerNames.removeAll(StandardHeaders.headers);
        headerNames.remove("cookie");

        return headerNames;
    }

    Set<String> headerKeys;
    public String fetchNonStandardHeaderKeys() {
        this.headerKeys = findNonStandardHeaderKeys(this.apiCollectionId);
        return SUCCESS.toUpperCase();
    }

    Map<String, BasicDBObject> propertyIds;
    public String fetchPropertyIds() {
        this.propertyIds = new HashMap<>();
        for(TestCollectionProperty.Id ee: TestCollectionProperty.Id.values()) {
            BasicDBObject enumProps =
                new BasicDBObject("id", ee.name())
                .append("title", ee.getTitle())
                .append("type", ee.getType())
                .append("impactingCategories", ee.getImpactingCategories());
            propertyIds.put(ee.name(), enumProps);
        }
        return SUCCESS.toUpperCase();
    }

    public void setApiCollectionId(int apiCollectionId) {
        this.apiCollectionId = apiCollectionId;
    }

    public List<TestCollectionProperty> getTestCollectionProperties() {
        return testCollectionProperties;
    }

    public Map<String, BasicDBObject> getPropertyIds() {
        return propertyIds;
    }

}
