package com.autonomy.abc.selenium.actions.wizard;

import com.autonomy.abc.selenium.actions.Action;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public abstract class Wizard implements Action {
    private List<WizardStep> steps;
    private int currentStep;

    public Wizard() {
        steps = new ArrayList<>();
    }

    public Wizard(final List<WizardStep> steps) {
        this.steps = steps;
    }

    public List<WizardStep> getSteps() {
        return Collections.unmodifiableList(steps);
    }

    protected void setSteps(final List<WizardStep> steps) {
        this.steps = steps;
    }

    protected void add(final WizardStep wizardStep) {
        steps.add(wizardStep);
    }

    public WizardStep getCurrentStep() {
        return steps.get(currentStep);
    }

    public boolean onFinalStep() {
        return currentStep == steps.size() - 1;
    }

    protected void incrementStep() {
        currentStep++;
    }

    public abstract void next();

    public abstract void cancel();

    @Override
    public Object apply() {
        for (final WizardStep wizardStep : steps) {
            wizardStep.apply();
            next();
        }
        return null;
    }

}
