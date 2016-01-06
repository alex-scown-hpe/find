package com.autonomy.abc.selenium.element;

import com.autonomy.abc.selenium.util.ElementUtil;
import com.hp.autonomy.frontend.selenium.util.AppElement;
import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import java.util.ArrayList;
import java.util.List;

public class Trigger extends AppElement {
    public Trigger(WebElement element, WebDriver driver) {
        super(element, driver);
    }

    /* Adding triggers */
    private FormInput triggerAddBox() {
        return new FormInput(findElement(By.name("words")), getDriver());
    }

    public WebElement triggerAddButton() {
        return findElement(By.cssSelector("[type='submit']"));
    }

    public void addTrigger(String trigger) {
        triggerAddBox().setAndSubmit(trigger);
    }

    /* Removing triggers */
    public void removeTrigger(String trigger) {
        trigger(trigger).removeAndWait();
    }

    public void removeTriggerAsync(String trigger) {
        trigger(trigger).removeAsync();
    }

    /* Getting triggers */

    public Removable trigger(final String triggerName) {
        return new LabelBox(findElement(By.cssSelector("[data-id='" + triggerName + "']")), getDriver());
    }

    public List<String> getTriggersAsStrings(){
        return ElementUtil.getTexts(triggers());
    }

    public List<Removable> getTriggers(){
        final List<Removable> triggers = new ArrayList<>();
        for (final WebElement trigger : triggers()) {
            triggers.add(new LabelBox(trigger, getDriver()));
        }
        return triggers;
    }

    private List<WebElement> triggers(){
        return findElements(By.className("term"));
    }

    public String getTriggerError() {
        try {
            return findElement(By.cssSelector(".help-block")).getText();
        } catch (NoSuchElementException e) {
            return null;
        }
    }
}
