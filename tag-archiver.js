// tag-archiver.js
//
// Delete tags not applied to any incomplete tasks.
//
// As part of the "archiving" process, the following will happen:
//   1. A note is added to each *complete* tasks that had the archived tag.
//   2. A single "report" task is created with a summary (and marked complete).
//   3. Archived tags are deleted.
//
// For #1, any *complete* tasks that have the tag will have a new note attached
// to it with the archived tag's name. For example if "projact-a" is archived,
// the note will have the content "milkscript:archive-tag #project-a".
//
// For #2, the "report" task will be named "milkscript:tag-archiver - archive
// report" and contain a note with a summary of tags archived (deleted) and the
// number of tasks impacted.
//
// A special "input" task can be created to control this script. Name the task
// "milkscript:tag-archiver" and include a single note. The note should contain
// a list of regex or strings (one per line) indicating tags to ignore in the
// archiving process. The input tasks's completion status is not considered. For
// example, the following note content would ignore tags starting with a period,
// as well as the tag "waiting":
//
//    /\..+/
//    waiting
//
// WARNING: This script has the potential to make significant changes to your
// tasks and tags. Proceed with caution!


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
