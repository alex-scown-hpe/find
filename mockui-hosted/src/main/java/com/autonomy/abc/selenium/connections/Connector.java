package com.autonomy.abc.selenium.connections;

import com.autonomy.abc.selenium.actions.wizard.Wizard;
import com.autonomy.abc.selenium.indexes.Index;

public abstract class Connector {
    protected String name;
    protected Index index;
    private ConnectionStatistics connectionStatistics;

    public Connector(String name) {
        this.name = name;
        this.index = new Index(name);
    }

    public Connector(String name, Index index){
        this.name = name;
        this.index = index;
    }

    public String getName() {
        return name;
    }

    public String getFinishedNotification() {
        return "Connection " + getName() + " has finished running";
    }

    public String getDeleteNotification() {
        return "Connection " + getName() + " successfully removed";
    }

    public abstract Wizard makeWizard(NewConnectionPage newConnectionPage);

    public Index getIndex(){
        return index;
    }

    public ConnectionStatistics getStatistics(){
        return connectionStatistics;
    }

    public void setStatistics(ConnectionStatistics connectionStatistics) {
        this.connectionStatistics = connectionStatistics;
    }

    public void setIndex(Index index) {
        this.index = index;
    }
}
