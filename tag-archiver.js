function readInputTask(task) {
    const notes = task.getNotes();
    const keepLines = notes[0].getContent().split(/\n/).map(i => i.trim());

    return keepLines.map(i => {
        if (i.startsWith('/') && i.endsWith('/')) {
            return (tagName) => {
                const re = new RegExp(i.slice(1, i.length - 1));
                return tagName.match(re) !== null
            }
        } else {
            return (tagName) => tagName.trim() === i;
        }
    });
}

const tasks = rtm.getTasks('name:"milkscript:tag-archiver"').filter(t => t.getName() === "milkscript:tag-archiver");
if (tasks.length === 1) {
    const keepTests = readInputTask(tasks[0]);

    const tagsToArchive = rtm.getTags().filter(tag => {
        const tagName = tag.getName();
        const onKeepList = keepTests.find(test => test(tagName));
        return !onKeepList && tag.getTasks('status:incomplete').length === 0;
    });

    const reportNotes = [];
    tagsToArchive.forEach(tag => {
        const tagName = tag.getName();
        console.log(`Archiving tag ${tagName}`);

        // archive
        const tasks = rtm.getTasks(`status:complete AND tag:"${tagName}"`);
        tasks.forEach(task => {
            task.addNote(`milkscript:archive-tag #${tagName}`);
        });
        tag.delete();
        reportNotes.push(`${tagName} - ${tasks.length} completed tasks updated`)
    });
    rtm.addTask('milkscript:tag-archiver - archive report').addNote(reportNotes.join('\n')).complete();
}
