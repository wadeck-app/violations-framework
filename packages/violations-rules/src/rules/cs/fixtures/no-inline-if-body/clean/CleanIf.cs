public class CleanClass
{
    public void Foo(int x)
    {
        if (x < 0) {
            x = 0;
        }
        if (x > 100) {
            x = 100;
        }
    }
}
