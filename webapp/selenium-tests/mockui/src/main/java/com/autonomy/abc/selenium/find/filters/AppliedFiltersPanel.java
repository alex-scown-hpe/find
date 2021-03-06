/*
 * Copyright 2015-2017 Hewlett Packard Enterprise Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

package com.autonomy.abc.selenium.find.filters;

import com.autonomy.abc.selenium.find.Container;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import java.util.List;

public class AppliedFiltersPanel {
    private final WebElement panel;

    public AppliedFiltersPanel(final WebDriver driver) {
        this.panel = Container.LEFT.findUsing(driver)
                .findElement(By.cssSelector(".left-side-applied-filters-view-section"));
    }

    public List<WebElement> getAppliedFilters() {
        return panel.findElements(By.cssSelector(".filters-labels .filter-label"));
    }

    public WebElement getHeader() {
        return panel.findElement(By.cssSelector(".left-side-applied-filters-view-title"));
    }

    public WebElement appliedFilterCounter() {
        return getHeader().findElement(By.cssSelector(".section-title-counter"));
    }

    public WebElement getRemoveAllFiltersButton() {
        return panel.findElement(By.cssSelector(".section-controls .remove-all-filters"));
    }

    public WebElement getPanel() {
        return panel;
    }
}
